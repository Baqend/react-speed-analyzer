import express from 'express'
import morgan from 'morgan'
import puppeteer from 'puppeteer'
import { parse } from 'url'
import { analyzeServiceWorkers } from './analyzeServiceWorkers'
import { analyzeStats } from './analyzeStats'
import { analyzeTimings } from './analyzeTimings'
import { analyzeType } from './analyzeType'

function getBetterProtocol(now: string, other: string | undefined): string {
  if (!other) {
    return now
  }

  if (now === 'h2' || other === 'h2') {
    return 'h2'
  }

  if (now === 'http/1.1' || other === 'http/1.1') {
    return 'http/1.1'
  }

  return now
}

export interface Options {
  caching: boolean
  timings: boolean
  userDataDir: string | null
}

export async function server(port: number, { caching, timings, userDataDir }: Options) {
  if (caching && !userDataDir) {
    throw new Error('Please provide a userDataDir to enable caching')
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox'], userDataDir })
  const app = express()

  app.use(morgan('common'))

  app.use(express.static('public'))

  app.get('/config', async (req, res) => {
    const { url: request } = req.query

    try {
      const page = await browser.newPage()
      try {
        await page.setCacheEnabled(caching)

        const resourceSet = new Set<Resource>()
        const domains = new Set<string>()
        const protocols = new Map<string, string>()

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

          // Record the protocol
          protocols.set(host, getBetterProtocol(protocol, protocols.get(host)))

          resourceSet.add({
            requestId,
            url,
            headers,
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
          })
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
        const documentResource = [...resourceSet].find(it => it.url === url)

        // Get the protocol
        const protocol = documentResource.protocol

        // Concurrently analyze
        const promises: Array<any | Promise<any>> = [
          // Type analysis
          analyzeType(page, documentResource),

          // Calculate statistics
          analyzeStats(resourceSet, domains),

          // Service Worker and Speed Kit detection
          analyzeServiceWorkers(browser, page),
        ]
        if (timings) {
          // Timings analysis
          promises.push(analyzeTimings(client, page, documentResource))
        }
        const analyses = await Promise.all(promises)

        // URL information
        const urlInfo = parse(url)

        // Stop all service workers in the end
        for (const [id, sw] of swRegistrations) {
          const { scopeURL } = sw
          await client.send('ServiceWorker.unregister', { scopeURL })
        }

        const finished = Date.now()
        console.log(`request = ${end - start}ms, stats = ${finished - end}ms, overall ${finished - start}ms`)

        res.status(200)
        res.json(Object.assign({
          url,
          protocol,
          domains: [...domains],
          protocols: [...protocols],
          urlInfo,
        }, ...analyses))
      } catch (e) {
        res.status(404)
        res.json({ message: e.message, stack: e.stack, url: request })
      } finally {
        page.close()
      }
    } catch (e) {
      res.status(500)
      res.json({ message: e.message, stack: e.stack, url: request })
    }
  })

  const hostname = '0.0.0.0'
  app.listen(port, () => {
    console.log(`Server is listening on http://${hostname}:${port}/config`)
    console.log(`Caching is ${caching ? `enabled, caching to ${userDataDir}` : 'disabled'}`)
    timings && console.log('Timings are tracked')
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
