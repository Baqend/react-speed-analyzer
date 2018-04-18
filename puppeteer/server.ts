import express from 'express'
import morgan from 'morgan'
import { resolve } from 'path'
import { toUnicode } from 'punycode'
import puppeteer from 'puppeteer'
import { format, parse } from 'url'
import { analyzeScreenshot } from './analyzeScreenshot'
import { analyzeServiceWorkers } from './analyzeServiceWorkers'
import { analyzeStats } from './analyzeStats'
import { analyzeTimings } from './analyzeTimings'
import { analyzeType } from './analyzeType'

const screenshotDir = resolve(__dirname, 'public', 'screenshots')

export interface Options {
  caching: boolean
  userDataDir: string | null
  noSandbox: boolean
}

export interface Segments {
  timings: boolean
  speedKit: boolean
  type: boolean
  stats: boolean
  screenshot: boolean
}

function tailHead<T>(array: T[]): [T[], T] {
  const it = array.pop()
  return [array, it]
}

function normalizeUrl(request: string): string {
  if (request.startsWith('//')) {
    return `http:${decodeURIComponent(request)}`
  }

  if (!request.startsWith('http')) {
    return `http://${decodeURIComponent(request)}`
  }

  return decodeURIComponent(request)
}

/**
 * Converts a punycode URL to a UTF-8 URL.
 */
function urlToUnicode(url: string): string {
  const { hostname, protocol, search, query, port, pathname } = parse(url)
  const obj = {
    hostname: toUnicode(hostname!),
    pathname: decodeURIComponent(pathname || ''),
    protocol,
    search,
    query,
    port,
  }

  return format(obj)
}

function getEnabledSegments(segments: string[]): Segments {
  const defaults: Segments = {
    timings: false,
    speedKit: false,
    type: false,
    stats: false,
    screenshot: false,
  }
  for (const segment of segments) {
    if (segment in defaults) {
      defaults[segment] = true
    }
  }

  return defaults
}

export async function server(port: number, { caching, userDataDir, noSandbox }: Options) {
  if (caching && !userDataDir) {
    throw new Error('Please provide a userDataDir to enable caching')
  }

  const args = noSandbox ? ['--no-sandbox'] : []
  const browser = await puppeteer.launch({ args, userDataDir })
  const app = express()

  app.use(morgan('common'))

  app.use(express.static('public'))

  app.use(async (req, res) => {
    const [segments, rest] = tailHead(req.url.substr(1).split(/;/g))
    const request = normalizeUrl(rest)

    const { timings, speedKit, type, stats, screenshot } = getEnabledSegments(segments)
    try {
      const page = await browser.newPage()
      try {
        await page.setCacheEnabled(caching)

        const resources = new Map<string, Resource>()
        const domains = new Set<string>()

        // Get CDP client
        const client = await page.target().createCDPSession()

        // Activate CDP controls
        const cdpControls: Array<Promise<any>> = [
          // Enable network control
          client.send('Network.enable'),

          // Enable ServiceWorker control
          client.send('ServiceWorker.enable'),
        ]
        if (timings) {
          // Enable performance statistics
          cdpControls.push(client.send('Performance.enable'))
        }
        await Promise.all(cdpControls)

        // Track domains and resources being loaded
        await client.on('Network.responseReceived', ({ requestId, type, timestamp, response }) => {
          const { url, headers: bareHeaders, status, mimeType, protocol, fromServiceWorker, fromDiskCache, timing } = response

          const headers = new Map(Object.entries(bareHeaders).map(([key, value]) => [key.toLowerCase(), value] as [string, string]))

          const { host, protocol: scheme, pathname } = parse(url)
          domains.add(host)

          const compressed: boolean = headers.has('content-encoding') && headers.get('content-encoding').toLowerCase() !== 'identity'

          resources.set(requestId, {
            requestId,
            url,
            headers,
            compressed,
            type,
            host,
            scheme,
            pathname,
            status,
            mimeType,
            protocol,
            fromServiceWorker,
            fromDiskCache,
            timing,
            loadStart: timing.requestTime,
          })
        })

        await client.on('Network.loadingFinished', ({ requestId, timestamp, encodedDataLength }) => {
          const resource = resources.get(requestId)
          if (resource) {
            resource.size = encodedDataLength
            resource.loadEnd = timestamp
          }
        })

        // Collect all service worker registrations
        const swRegistrations = new Map<string, ServiceWorkerRegistration>()
        await client.on('ServiceWorker.workerRegistrationUpdated', ({ registrations }: { registrations: ServiceWorkerRegistration[] }) => {
          for (const registration of registrations) {
            swRegistrations.set(registration.registrationId, registration)
          }
        })

        // Load the document
        const start = Date.now()
        const response = await page.goto(request)
        const end = Date.now()
        const url = response.url()
        const displayUrl = urlToUnicode(url)
        const documentResource = [...resources.values()].find(it => it.url === url)

        // Get the protocol
        const protocol = documentResource.protocol

        // Concurrently analyze
        const promises: Array<any | Promise<any>> = []
        if (type) {
          // Type analysis
          promises.push(analyzeType(page, documentResource))
        }

        if (stats) {
          // Calculate statistics
          promises.push(analyzeStats(resources.values(), domains))
        }

        if (speedKit) {
          // Service Worker and Speed Kit detection
          promises.push(analyzeServiceWorkers(browser, page))
        }

        if (timings) {
          // Timings analysis
          promises.push(analyzeTimings(client, page, documentResource))
        }

        if (screenshot) {
          // Screenshot analysis
          promises.push(analyzeScreenshot(page, screenshotDir, req.get('host')))
        }
        const analyses = await Promise.all(promises)

        // Stop all service workers in the end
        for (const sw of swRegistrations.values()) {
          const { scopeURL } = sw
          await client.send('ServiceWorker.unregister', { scopeURL })
        }

        const finished = Date.now()
        console.log(`request = ${end - start}ms, stats = ${finished - end}ms, overall ${finished - start}ms`)

        res.status(200)
        res.json(Object.assign({
          request,
          segments,
          url,
          displayUrl,
          protocol,
          domains: [...domains],
        }, ...analyses))
      } catch (e) {
        res.status(404)
        res.json({ message: e.message, stack: e.stack, url: request, segments })
      } finally {
        await page.close()
      }
    } catch (e) {
      res.status(500)
      res.json({ message: e.message, stack: e.stack, url: request, segments })
    }
  })

  const hostname = '0.0.0.0'
  app.listen(port, () => {
    console.log(`Server is listening on http://${hostname}:${port}/config`)
    console.log(`Caching is ${caching ? `enabled, caching to ${userDataDir}` : 'disabled'}`)
    noSandbox && console.log('Running chrome in no-sandbox mode')
  })

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down')
    await browser.close()
    process.exit()
  })

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down')
    await browser.close()
    process.exit()
  })
}
