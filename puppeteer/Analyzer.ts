import { Request } from 'express'
import { CDPSession, Page } from 'puppeteer'
import { filterServiceWorkerRegistrationsByUrl, getDomainsOfResources, tailFoot } from './helpers'
import { listenForResources } from './listenForResources'
import { listenForServiceWorkerRegistrations } from './listenForServiceWorkerRegistrations'
import { normalizeUrl, urlToUnicode } from './urls'
import * as analyzers from './analyzers'

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

export class Analyzer {
  private readonly analyzerFunctions: Map<string, AnalyzerFunction>
  private readonly screenshotDir: string

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

  async handleRequest(page: Page, client: CDPSession, req: Request): Promise<JSON> {
    const [segments, query] = tailFoot(req.url.substr(1).split(/;/g))
    const normalizedQuery = normalizeUrl(query)

    // Listen for Network
    const resources = await listenForResources(client)

    // Collect all service worker registrations
    const serviceWorkers = await listenForServiceWorkerRegistrations(client)

    // Load the document
    const response = await page.goto(normalizedQuery)
    const url = response.url()
    const displayUrl = urlToUnicode(url)
    const domains = getDomainsOfResources(resources.values())

    // Filter out all registrations which are not against this URL
    filterServiceWorkerRegistrationsByUrl(serviceWorkers, url)

    const documentResource = [...resources.values()].find(it => it.url === url)

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

    // Stop all service workers in the end
    for (const sw of serviceWorkers.values()) {
      const { scopeURL } = sw
      await client.send('ServiceWorker.unregister', { scopeURL })
    }

    return Object.assign({
      query,
      segments,
      url,
      displayUrl,
      protocol,
      domains: [...domains],
    }, ...analyses)
  }
}
