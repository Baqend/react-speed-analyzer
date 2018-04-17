import { CDPSession, Page } from 'puppeteer'
import { difference, kebabToCamelCase, lcFirst, mergeMaps, objectToMap, optionalNumber } from './helpers'

export async function analyzeTimings(client: CDPSession, page: Page, document: Resource): Promise<{ timings: Timings }> {
  const metricsMap = await getPerformanceMetrics(client)
  const paintTimings = await getPaintTimings(page)
  const documentTimings = objectToMap(document.timing)
  mergeMaps(metricsMap, paintTimings, documentTimings)

  return { timings: aggregateTimings(metricsMap) }
}

async function getPerformanceMetrics(client: CDPSession): Promise<Map<string, number>> {
  const perf = await client.send('Performance.getMetrics')

  return new Map<string, number>(perf.metrics.map(({ name, value }) => [lcFirst(name), value]))
}


async function getPaintTimings(page: Page): Promise<Map<string, number>> {
  const map = await page.evaluate(() => {
    return performance.getEntriesByType('paint').map(timing => [timing.name, timing.startTime])
  })

  return new Map<string, number>(map.map(([name, time]) => [kebabToCamelCase(name), time]))
}

function aggregateTimings(map: Map<string, number>): Timings {
  const dnsLookup = difference(map.get('dnsEnd'), map.get('dnsStart'))
  const initialConnection = difference(map.get('connectEnd'), map.get('connectStart'))
  const proxyNegotiation = difference(map.get('proxyEnd'), map.get('proxyStart'))
  const serviceWorker = difference(map.get('workerEnd'), map.get('workerStart'))
  const ssl = difference(map.get('sslEnd'), map.get('sslStart'))
  const requestSent = difference(map.get('sendEnd'), map.get('sendStart'))
  const ttfb = difference(map.get('receiveHeadersEnd'), map.get('sendEnd'))
  const firstPaint = optionalNumber(map.get('firstPaint'))
  const firstContentfulPaint = optionalNumber(map.get('firstContentfulPaint'))
  const domContentLoaded = difference(map.get('domContentLoaded'), map.get('requestTime'), 1000)
  const fullyLoaded = difference(map.get('timestamp'), map.get('requestTime'), 1000)

  return { dnsLookup, initialConnection, proxyNegotiation, serviceWorker, ssl, requestSent, ttfb, firstPaint, firstContentfulPaint, domContentLoaded, fullyLoaded }
}
