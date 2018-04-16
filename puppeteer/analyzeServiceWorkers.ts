import fetch from 'node-fetch'
import { Browser, Page, Target } from 'puppeteer'
import { parse } from 'url'

export async function analyzeServiceWorkers(browser: Browser, page: Page) {
  const swTargets = await findServiceWorkers(browser)
  const serviceWorkers = swTargets.map(target => target.url())
  const speedKit = await findSpeedKit(page, swTargets)

  return { serviceWorkers, speedKit }
}

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
