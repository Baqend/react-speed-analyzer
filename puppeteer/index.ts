import puppeteer from 'puppeteer'
import express from 'express'
import { parse } from 'url'

interface Resource {
  url: string
  type: string
  host: string
  scheme: string
  pathname: string
  status: number
  mimeType: string
  protocol: string
  fromServiceWorker: boolean
  fromDiskCache: boolean
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

      // Track domains being loaded
      const client = await page.target().createCDPSession()
      await client.send('Network.enable')
      await client.on('Network.responseReceived', ({ type, timestamp, response }) => {
        const { url, status, mimeType, protocol, fromServiceWorker, fromDiskCache } = response
        const { host, protocol: scheme, pathname } = parse(url)
        domains.add(host)
        if (protocols.has(host) && protocols.get(host) !== protocol) {
          throw new Error(`${host} sent more than 1 protocol?`)
        }
        protocols.set(host, protocol)
        resourceSet.add({
          url,
          type,
          host,
          scheme,
          pathname,
          status,
          mimeType,
          protocol,
          fromServiceWorker,
          fromDiskCache
        })
      })

      const response = await page.goto(request)
      const url = response.url()

      const { protocol, host, pathname, search, query, hash } = parse(url)

      const httpProtocol = protocols.get(host)


      const targets = await browser.targets()
      const swTargets = targets.filter(target => target.type() === 'service_worker')
      const serviceWorkers = swTargets.map(target => ({ url: target.url() }))

      let speedKit = null
      for (const target of swTargets) {
        const swUrl = target.url()
        const speedKitResponse = await page.goto(swUrl)
        const speedKitText = await speedKitResponse.text()
        const match = speedKitText.match(/\/\* ! speed-kit (\d+\.\d+\.\d+) \| Copyright \(c\) (\d+) Baqend GmbH \*\//)
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
          const [, version, year] = match
          const { appName, appDomain = null } = config

          speedKit = { version, year, swUrl, swPath, appName, appDomain, config }
        }
      }

      const paintTimings = new Map<string, number>(await page.evaluate(() => {
        return performance.getEntriesByType('paint').map(timing => [timing.name, timing.startTime])
      }))

      const performanceTimings = await page.evaluate(() => {
        return performance.getEntriesByType('navigation').map(it => ({
          fetchStart: it.fetchStart,
          domComplete: it.domComplete,
          domInteractive: it.domInteractive,
          duration: it.duration,
          dnsLookup: it.domainLookupEnd - it.domainLookupStart,
          initialConnection: it.connectEnd - it.connectStart,
          ttfb: it.responseStart - it.requestStart,
          contentDownload: it.responseEnd - it.responseStart,
        }))[0] || {}
      })

      const timings = Object.assign(performanceTimings, {
        firstPaint: paintTimings.get('first-paint'),
        firstContentfulPaint: paintTimings.get('first-contentful-paint'),
      })

      const total = resourceSet.size
      const resources = [...resourceSet]
      const errors = resources.filter(resource => resource.status >= 400).length
      const redirects = resources.filter(resource => resource.status >= 300 && resource.status < 400).length
      const successful = resources.filter(resource => resource.status < 300).length
      const fromServiceWorker = resources.filter(resource => resource.fromServiceWorker).length
      const stats = { total, domains: domains.size, errors, redirects, successful, fromServiceWorker }

      res.status(200)
      res.json({
        url,
        httpProtocol,
        resources,
        domains: [...domains],
        protocols: [...protocols],
        urlInfo: { protocol, host, pathname, search, query, hash },
        serviceWorkers,
        stats,
        timings,
        speedKit
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

app.listen(8080, '0.0.0.0', () => {
  console.log('Server is listening on http://0.0.0.0:80/config')
})
