import { Request } from 'express'
import { Browser, CDPSession, Page } from 'puppeteer'
import * as analyzers from './analyzers'
import { filterServiceWorkerRegistrationsByUrl, getDomainsOfResources, tailFoot } from './helpers'
import { listenForResources } from './listenForResources'
import { listenForServiceWorkerRegistrations } from './listenForServiceWorkerRegistrations'
import { normalizeUrl, urlToUnicode } from './urls'

export interface AnalyzeEvent {
  client: CDPSession
  documentResource: Resource
  domains: Set<string>
  page: Page
  resources: Iterable<Resource>
  screenshotDir: string
  serviceWorkers: Iterable<ServiceWorkerRegistration>
}

declare type JSON = { [key: string]: JSON } | object[] | string | number
declare type AnalyzeResult = SpeedKit | Timings | Type | JSON | ((req: Request) => JSON)

type AnalyzerFunction = (event: AnalyzeEvent) => Promise<AnalyzeResult>

interface Context {
  page: Page
  client: CDPSession
  documentResource: Resource
  serviceWorkers: ServiceWorkerRegistrationMap
  domains: Set<string>
  resources: ResourceMap
  url: string
  displayUrl: string
}

const MAX_CONCURRENT_CONTEXTS = 20

export class Analyzer {
  private readonly analyzerFunctions: Map<string, AnalyzerFunction>
  private readonly screenshotDir: string
  private readonly contextListeners: Map<string, number> = new Map()
  private readonly contextPromises: Map<string, Promise<Context>> = new Map()
  private readonly loadersWaiting: Array<() => void> = []

  constructor(screenshotDir: string) {
    this.screenshotDir = screenshotDir
    this.analyzerFunctions = new Map<string, AnalyzerFunction>([
      ['pdf', analyzers.analyzePdf],
      ['screenshot', analyzers.analyzeScreenshot],
      ['speedKit', analyzers.analyzeSpeedKit],
      ['stats', analyzers.analyzeStats],
      ['timings', analyzers.analyzeTimings],
      ['type', analyzers.analyzeType],
    ])
  }

  /**
   * Handles an incoming request.
   */
  async handleRequest(browser: Browser, req: Request): Promise<JSON> {
    const [segments, query] = tailFoot(req.url.substr(1).split(/;/g))
    const normalizedQuery = normalizeUrl(query)

    const { client, page, url, displayUrl, documentResource, domains, resources, serviceWorkers } = await this.loadContext(browser, normalizedQuery)
    try {

      // Get the protocol
      const protocol = documentResource.protocol

      const event: AnalyzeEvent = {
        client,
        page,
        documentResource,
        domains,
        resources: resources.values(),
        screenshotDir: this.screenshotDir,
        serviceWorkers: serviceWorkers.values(),
      }

      // Start analysis of each requested segment
      const promises: Promise<{ [key: string]: JSON }>[] = []
      for (const segment of segments) {
        if (this.analyzerFunctions.has(segment)) {
          promises.push(this.analyzerFunctions.get(segment)!.call(null, event).then((result) => {
            if (typeof result === 'function') {
              return { [segment]: result(req) }
            }

            return { [segment]: result }
          }))
        }
      }

      // Wait for analyses to finish
      const analyses = await Promise.all(promises)

      return Object.assign({
        query,
        segments,
        url,
        displayUrl,
        protocol,
        domains: [...domains],
      }, ...analyses)
    } finally {
      // Close the context
      await this.closeContext(normalizedQuery)
    }
  }

  /**
   * Loads the context for a given query in a given browser.
   */
  loadContext(browser: Browser, query: string): Promise<Context> {
    // Increase the number of listeners
    const l = (this.contextListeners.get(query) || 0) + 1
    this.contextListeners.set(query, l)

    // Is query not loading yet?
    if (!this.contextPromises.has(query)) {
      this.contextPromises.set(query, this.doLoadContext(browser, query))
    }

    return this.contextPromises.get(query)!
  }

  /**
   * Closes the context for a given browser.
   */
  closeContext(query: string): Promise<void> {
    // Decrease the number of listeners
    const l = this.contextListeners.get(query)! - 1
    this.contextListeners.set(query, l)

    // Is nobody listening anymore? Close the page
    if (l <= 0) {
      return this.doCloseContext(query)
    }
  }

  private async doLoadContext(browser: Browser, query: string): Promise<Context> {
    // Let query wait until next page is finished
    if (this.contextPromises.size >= MAX_CONCURRENT_CONTEXTS) {
      await new Promise(resolver => this.loadersWaiting.push(resolver))
    }

    // Open the next page
    const page = await browser.newPage()
    await page.setCacheEnabled(true)

    // Get CDP client
    const client = await page.target().createCDPSession()

    // Activate CDP controls
    await Promise.all([
      // Enable network control
      client.send('Network.enable'),
      // Enable ServiceWorker control
      client.send('ServiceWorker.enable'),
      // Enable performance statistics
      client.send('Performance.enable'),
    ])

    // Listen for Network
    const resources = await listenForResources(client)

    // Collect all service worker registrations
    const serviceWorkers = await listenForServiceWorkerRegistrations(client)

    // Load the document
    const response = await page.goto(query)
    const url = response.url()
    const displayUrl = urlToUnicode(url)
    const domains = getDomainsOfResources(resources.values())

    // Filter out all registrations which are not against this URL
    filterServiceWorkerRegistrationsByUrl(serviceWorkers, url)

    const documentResource = [...resources.values()].find(it => it.url === url)

    return { client, page, url, displayUrl, documentResource, serviceWorkers, domains, resources }
  }

  private async doCloseContext(query: string): Promise<void> {
    // This should be a resolved promise!
    const { page, client, serviceWorkers } = await this.contextPromises.get(query)

    // Do not provide this promise anymore
    this.contextPromises.delete(query)
    this.contextListeners.set(query, 0)

    // Stop all service workers on that page
    for (const sw of serviceWorkers.values()) {
      const { scopeURL } = sw
      await client.send('ServiceWorker.unregister', { scopeURL })
    }

    // Close the page
    await page.close()

    // Are there loaders waiting? Allow the next one
    if (this.loadersWaiting.length) {
      const next = this.loadersWaiting.shift()!
      next()
    }
  }
}
