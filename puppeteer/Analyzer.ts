import { Request } from 'express'
import { toASCII } from 'punycode'
import { Browser, CDPSession, Page } from 'puppeteer'
import { parse } from 'url'
import * as analyzers from './analyzers'
import { filterServiceWorkerRegistrationsByUrl, getDomainsOfResources, tailFoot } from './helpers'
import { listenForPermanentRedirects, listenForResources, listenForServiceWorkerRegistrations } from './listeners'
import { urlToUnicode } from './urls'

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
  scheme: string
  host: string
}

const MAX_CONCURRENT_CONTEXTS = 20

export class Analyzer {
  private readonly analyzerFunctions: Map<string, AnalyzerFunction>
  private readonly screenshotDir: string
  private readonly contextListeners: Map<string, number> = new Map()
  private readonly contextPromises: Map<string, Promise<Context>> = new Map()
  private readonly loadersWaiting: Array<() => void> = []
  private readonly permanentRedirects: Map<string, string> = new Map()
  private readonly schemeMap: Map<string, string> = new Map()
  private readonly candidateBlacklist: Set<string> = new Set()

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
  async handleRequest(browser: Browser, req: Request): Promise<any> {
    const [segments, encodedQuery] = tailFoot(req.url.substr(1).split(/;/g))
    const query = decodeURIComponent(encodedQuery)

    // Get possible candidates to navigate to and find best result
    const candidates = this.normalizeUrl(query)
    const result = await this.raceBestResult(browser, req, segments, candidates)
    if (result) {
      return Object.assign({ query, candidates }, result)
    }

    return null
  }

  async handleQuery(browser: Browser, req: Request, segments: string[], query: string) {
    const context = await this.loadContext(browser, query)
    const { client, page, url, displayUrl, scheme, host, documentResource, domains, resources, serviceWorkers } = context
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
        url,
        displayUrl,
        scheme,
        host,
        protocol,
        domains: [...domains],
      }, ...analyses)
    } finally {
      // Close the context
      await this.closeContext(query)
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

  /**
   * Races for the best result.
   */
  private raceBestResult(browser: Browser, req: Request, segments: string[], candidates: string[]) {
    if (candidates.length === 0) {
      return null
    }

    if (candidates.length === 1) {
      return this.handleQuery(browser, req, segments, candidates[0])
    }

    return new Promise((resolveOuter) => {
      const promises = candidates.map(async (candidate) => {
        try {
          const result = await this.handleQuery(browser, req, segments, candidate)
          if (result && result.scheme === 'https:') {
            resolveOuter(result)
            return null
          }

          return result
        } catch (error) {
          // Does this candidate cause an error? Blacklist it
          this.candidateBlacklist.add(candidate)

          return null
        }
      })

      // Fallback to best matching result
      Promise.all(promises)
        // Find a candidate which does not evaluate to null
        .then(results => results.reduce((p, r) => p || r, null))
        // Return it as the result
        .then(resolveOuter)
    })
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

    // Collect all permanent redirects
    await listenForPermanentRedirects(client, this.permanentRedirects, this.schemeMap)

    // Load the document
    const response = await page.goto(query)
    const url = response.url()
    const displayUrl = urlToUnicode(url)

    // Save scheme for given host
    const { protocol: scheme, host } = parse(url)
    if (!this.schemeMap.has(host) || scheme === 'https:') {
      this.schemeMap.set(host, scheme)
    }

    const domains = getDomainsOfResources(resources.values())

    // Filter out all registrations which are not against this URL
    filterServiceWorkerRegistrationsByUrl(serviceWorkers, url)

    const documentResource = [...resources.values()].find(it => it.url === url)

    return { client, page, url, displayUrl, scheme, host, documentResource, serviceWorkers, domains, resources }
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

  /**
   * Normalize the given URL.
   */
  private normalizeUrl(url: string): string[] {
    const match = url.match(/^(https?:|)(?:\/\/|)(\[[^\]]+]|[^/:]+)(:\d+|)(.*)$/)
    if (match) {
      const [, explicitScheme, utf8Hostname, port, path] = match
      const hostname = toASCII(utf8Hostname)
      const host = `${hostname}${port}`
      const hierarchicalPart = `//${host}${path || '/'}`
      const scheme = this.schemeMap.get(host) || explicitScheme || null

      // No scheme available? Look for redirect
      if (!scheme) {
        return this.selectUrls(`https:${hierarchicalPart}`, `http:${hierarchicalPart}`)
      }

      return this.selectUrls(`${scheme}${hierarchicalPart}`)
    }

    throw new Error(`Invalid URL queried: ${url}`)
  }

  /**
   * Selects normalized URLs as possible candidates.
   */
  private selectUrls(...urls: string[]): string[] {
    const set = new Set<string>()
    for (let url of urls) {
      while (this.permanentRedirects.has(url)) {
        url = this.permanentRedirects.get(url)
      }

      if (!this.candidateBlacklist.has(url)) {
        set.add(url)
      }
    }

    return [...set]
  }
}
