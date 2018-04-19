import fetch from 'node-fetch'
import { Page } from 'puppeteer'
import { parse } from 'url'
import { AnalyzeEvent } from '../Analyzer'

const etagCache = new Map<string, string>()
const speedKitCache = new Map<string, SpeedKit | null>()

export async function analyzeSpeedKit({ serviceWorkers, page }: AnalyzeEvent) {
  for (const serviceWorker of serviceWorkers) {
    const swUrl = serviceWorker.scriptURL
    const etag = etagCache.get(swUrl)

    const speedKit = await loadSpeedKit(swUrl, etag, page)
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
    return speedKitCache.get(swUrl)
  }

  if (newEtag) {
    etagCache.set(swUrl, newEtag)
  }
  const text = await response.text()
  const match = text.match(/\/\* ! speed-kit (\d+)\.(\d+)\.(\d+)(|-\w*) \| Copyright \(c\) (\d+) Baqend GmbH \*\//)
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
    const [, majorStr, minorStr, patchStr, stabilityStr, yearStr] = match
    const major = parseInt(majorStr, 10)
    const minor = parseInt(minorStr, 10)
    const patch = parseInt(patchStr, 10)
    const stability = stabilityStr.length ? stabilityStr.substr(1) : null
    const year = parseInt(yearStr, 10)
    const { appName = null, appDomain = null } = (config || {})

    const speedKit = { major, minor, patch, stability, year, swUrl, swPath, appName, appDomain, config }
    speedKitCache.set(swUrl, speedKit)
    return speedKit
  }

  return null
}
