import chalk from 'chalk'
import express from 'express'
import morgan from 'morgan'
import { resolve } from 'path'
import puppeteer from 'puppeteer'
import rimraf from 'rimraf'
import { parse } from 'url'
import { analyzePdf } from './analyzePdf'
import { analyzeScreenshot } from './analyzeScreenshot'
import { analyzeSpeedKit } from './analyzeSpeedKit'
import { analyzeStats } from './analyzeStats'
import { analyzeTimings } from './analyzeTimings'
import { analyzeType } from './analyzeType'
import { normalizeUrl, tailHead, urlToUnicode } from './helpers'

const screenshotDir = resolve(__dirname, 'public', 'screenshots')
const sizeCache = new Map<string, number>()

function getEnabledSegments(segments: string[]): Segments {
  const defaults: Segments = {
    timings: false,
    speedKit: false,
    type: false,
    stats: false,
    screenshot: false,
    pdf: false,
  }
  for (const segment of segments) {
    if (segment in defaults) {
      defaults[segment] = true
    }
  }

  return defaults
}

/**
 * Deletes a directory.
 */
function deleteDirectory(dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    rimraf(dir, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function getErrorStatusCode({ message }: Error): number {
  if (message.startsWith('Navigation Timeout Exceeded')) {
    return 504
  }

  if (message.startsWith('net::ERR_NAME_NOT_RESOLVED')) {
    return 404
  }

  return 500
}

export async function server(port: number, { caching, userDataDir, noSandbox }: Options) {
  if (caching && !userDataDir) {
    throw new Error('Please provide a userDataDir to enable caching')
  }

  if (userDataDir) {
    await deleteDirectory(userDataDir)
    console.log(`Deleted ${userDataDir}`)
  }

  const args = noSandbox ? ['--no-sandbox'] : []
  const browser = await puppeteer.launch({ args, userDataDir })
  const app = express()

  morgan.token('status', (req, res) => {
    const status = String(res.statusCode)
    if (res.statusCode >= 400) {
      return chalk.bgRed.black(status)
    } else if (res.statusCode >= 300) {
      return chalk.bgYellow.black(status)
    } else {
      return chalk.bgGreen.black(status)
    }
  })

  app.use(morgan(chalk`:remote-addr [:date[clf]] {yellow.bold :method} :status ":url" HTTP/:http-version :response-time`))

  app.use(express.static('public'))

  app.use(async (req, res) => {
    const [segments, rest] = tailHead(req.url.substr(1).split(/;/g))
    const request = normalizeUrl(rest)

    const { timings, speedKit, type, stats, screenshot, pdf } = getEnabledSegments(segments)
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

          const loadStart = timing ? timing.requestTime : -1
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
            loadStart,
            loadEnd: -1,
            size: sizeCache.get(url),
          })
        })

        await client.on('Network.loadingFinished', ({ requestId, timestamp, encodedDataLength }) => {
          const resource = resources.get(requestId)
          if (resource) {
            if (!resource.fromDiskCache && !resource.fromServiceWorker) {
              sizeCache.set(resource.url, encodedDataLength)
              resource.size = encodedDataLength
            }
            resource.loadEnd = timestamp
          }
        })

        // Collect all service worker registrations
        const swRegistrations = new Map<string, ServiceWorkerRegistration>()
        await client.on('ServiceWorker.workerRegistrationUpdated', ({ registrations }) => {
          for (const registration of registrations) {
            swRegistrations.set(registration.registrationId, registration)
          }
        })

        // Collect all script URLs
        if (speedKit) {
          await client.on('ServiceWorker.workerVersionUpdated', ({ versions }) => {
            for (const { registrationId, scriptURL } of versions) {
              const registration = swRegistrations.get(registrationId)
              if (registration) {
                registration.scriptURL = scriptURL
              }
            }
          })
        }

        // Load the document
        const response = await page.goto(request)
        const url = response.url()
        for (const [registrationId, registration] of swRegistrations) {
          if (!url.startsWith(registration.scopeURL)) {
            swRegistrations.delete(registrationId)
          }
        }

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
          promises.push(analyzeSpeedKit(swRegistrations.values(), page))
        }

        if (timings) {
          // Timings analysis
          promises.push(analyzeTimings(client, page, documentResource))
        }

        if (screenshot) {
          // Screenshot analysis
          promises.push(analyzeScreenshot(page, screenshotDir, req.get('host')))
        }

        if (pdf) {
          // Pdf analysis
          promises.push(analyzePdf(page, screenshotDir, req.get('host')))
        }
        const analyses = await Promise.all(promises)

        // Stop all service workers in the end
        for (const sw of swRegistrations.values()) {
          const { scopeURL } = sw
          await client.send('ServiceWorker.unregister', { scopeURL })
        }

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
        const status = getErrorStatusCode(e)
        res.status(status)
        res.json({ message: e.message, status, stack: e.stack, url: request, segments })
      } finally {
        await page.close()
      }
    } catch (e) {
      res.status(500)
      res.json({ message: e.message, status: 500, stack: e.stack, url: request, segments })
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
