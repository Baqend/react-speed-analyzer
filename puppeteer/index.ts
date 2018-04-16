import puppeteer, { Browser, CDPSession, Page, Target } from 'puppeteer'
import express from 'express'
import fetch from 'node-fetch'
import { parse } from 'url'
import { analyzeTimings } from './analyzeTimings'
import { analyzeStats } from './analyzeStats'

async function findServiceWorkers(browser: Browser): Promise<Target[]> {
  const targets = await browser.targets()

  return targets
    .filter(target => target.type() === 'service_worker')
}

async function findSpeedKit(page: Page, serviceWorkers: Target[]): Promise<SpeedKit | null> {
  for (const serviceWorker of serviceWorkers) {
    const swUrl = serviceWorker.url()
    const response = await fetch(swUrl)
    const text = await response.text()
    const match = text.match(/\/\* ! speed-kit (\d+\.\d+\.\d+) \| Copyright \(c\) (\d+) Baqend GmbH \*\//)
    if (match) {
      const config = await page.evaluate(async () => {
        try {
          const resp = await caches.match('com.baqend.speedkit.config')
          return JSON.parse(resp.statusText)
        } catch (e) {
          return null
        }
      })

      const { pathname: swPath } = parse(swUrl)
      const [, version, yearString] = match
      const year = parseInt(yearString, 10)
      const { appName = null, appDomain = null } = (config || {})

      return { version, year, swUrl, swPath, appName, appDomain, config }
    }
  }

  return null
}

const app = express()

app.get('/config', async (req, res) => {
  const { url: request } = req.query

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
    try {
      const page = await browser.newPage()

      const resourceSet = new Set<Resource>()
      const domains = new Set<string>()
      const protocols = new Map<string, string>()

      // Track domains and resources being loaded
      const client = await page.target().createCDPSession()
      await client.send('Network.enable')
      await client.on('Network.responseReceived', ({ requestId, type, timestamp, response }) => {
        const { url, status, mimeType, protocol, fromServiceWorker, fromDiskCache, timing } = response

        const { host, protocol: scheme, pathname } = parse(url)
        domains.add(host)
        protocols.set(host, protocol)
        resourceSet.add({
          requestId,
          url,
          type,
          host,
          scheme,
          pathname,
          status,
          mimeType,
          protocol,
          fromServiceWorker,
          fromDiskCache,
          timing
        })
      })

      // Enable performance statistics
      await client.send('Performance.enable')

      // Load the document
      const response = await page.goto(request)
      const url = response.url()
      const documentResource = [...resourceSet].find(it => it.url === url)

      // Get the protocol
      const protocol = documentResource.protocol

      // Timings analysis
      const timings = await analyzeTimings(client, page, documentResource)

      // Calculate statistics
      const stats = analyzeStats(resourceSet, domains)

      // Service Worker and Speed Kit detection
      const swTargets = await findServiceWorkers(browser)
      const serviceWorkers = swTargets.map(target => target.url())
      const speedKit = await findSpeedKit(page, swTargets)

      // URL information
      const urlInfo = parse(url)

      res.status(200)
      res.json({
        url,
        protocol,
        timings,
        stats,
        speedKit,
        domains: [...domains],
        protocols: [...protocols],
        urlInfo,
        serviceWorkers,
      })
    } catch (e) {
      res.status(404)
      res.json({ message: e.message, stack: e.stack, url: request })
    } finally {
      await browser.close()
    }
  } catch (e) {
    res.status(500)
    res.json({ message: e.message, stack: e.stack, url: request })
  }
})

const port = 8080
const hostname = '0.0.0.0'
app.listen(port, hostname, () => {
  console.log(`Server is listening on http://${hostname}:${port}/config`)
})
