import fetch from 'node-fetch'
import { Browser, Page, Target } from 'puppeteer'
import { parse } from 'url'

const etagCache = new Map<string, string>()
const speedKitCache = new Map<string, SpeedKit | null>()

export async function analyzeServiceWorkers(browser: Browser, page: Page) {
  const serviceWorkers = await findServiceWorkers(browser)
  const speedKit = await findSpeedKit(page, serviceWorkers)

  return { speedKit }
}

async function findServiceWorkers(browser: Browser): Promise<Target[]> {
  const targets = await browser.targets()

  return targets
    .filter(target => target.type() === 'service_worker')
}

async function findSpeedKit(page: Page, serviceWorkers: Target[]): Promise<SpeedKit | null> {
  for (const serviceWorker of serviceWorkers) {
    const swUrl = serviceWorker.url()
    const etag = etagCache.get(swUrl)

    const speedKit = loadSpeedKit(swUrl, etag, page)
    if (speedKit) {
      return speedKit
    }
  }

  return null
}

async function loadSpeedKit(swUrl: string, etag: string | undefined, page: Page): Promise<SpeedKit | null> {
  const headers = etag ? { 'if-none-match': etag } : {}
  const response = await fetch(swUrl, { headers })
  const newEtag = response.headers.get('etag')
  if (response.status === 304 || newEtag && newEtag === etag) {
    console.log(`Taking cached Speed Kit for ${etag}`)
    return speedKitCache.get(swUrl)
  }

  if (newEtag) {
    console.log(`Caching ETag ${newEtag} for ${swUrl}`)
    etagCache.set(swUrl, newEtag)
  }
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

    const speedKit = { version, year, swUrl, swPath, appName, appDomain, config }
    console.log(`Caching Speed Kit info for ${swUrl}`)
    speedKitCache.set(swUrl, speedKit)
    return speedKit
  }

  return null
}
