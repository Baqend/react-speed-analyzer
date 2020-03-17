import { baqend, model } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { parse } from 'url'
import fetch from 'node-fetch'

/**
 * Info retrieved from pages.
 */
interface SpeedKitInfo {
  speedKit: {
    speedKitVersion: string | null,
    swUrl: string | null
  }
}

/**
 * Wraps a promise to be used in a map.
 */
function forMap<K, V>(key: K, deferredValue: Promise<V>): Promise<[K, V]> {
  return deferredValue.then(value => [key, value] as [K, V])
}

/**
 * @param db The Baqend instance.
 * @param url The URL to look for Speed Kit.
 * @return An info object.
 */
async function fetchServiceWorkerUrl(db: baqend, url: string): Promise<SpeedKitInfo> {
  const error = { speedKit: { speedKitVersion: null, swUrl: null } }
  const parsedUrl = parse(url.indexOf('https://') !== -1 ? url : `https://${url}`)
  const swUrl = `${parsedUrl.protocol}//${parsedUrl.host}/sw.js`

  db.log.info('Fetch sw url', { swUrl })
  try {
    const res = await fetch(swUrl)
    if (!res.ok) {
      db.log.error('Resource not ok', { res })
      return error
    }

    const text = await res.text()
    const matches = /\/\* ! speed-kit ([\d.]+) \|/.exec(text)
    if (matches) {
      const [, speedKitVersion] = matches
      return { speedKit: { speedKitVersion, swUrl } }
    }

    return error
  } catch (e) {
    db.log.error('Error while fetching sw url', { error: e.stack })
    return error
  }
}

/**
 * Analyzes a bunch of URLs.
 * The result is given in a Map returning a result for each query sent.
 *
 * @param queries The URLs to test.
 * @param db The Baqend instance.
 * @param mobile Whether to fetch the mobile variant of the site.
 * @param fetchSW Whether to fetch the sw path.
 * @param location The location for the analyze.
 * @param timeout The timeout for Puppeteer
 * @return A promise which resolves with the analysis's result map.
 * @template Result
 */
export async function analyzeUrls(
  queries: string[],
  db: baqend,
  mobile: boolean = false,
  fetchSW = false,
  location = 'eu'
): Promise<Map<string, model.Puppeteer | SpeedKitInfo>> {
  if(fetchSW) {
    const analyses = queries.map(query => forMap(query, fetchServiceWorkerUrl(db, query,)))
    const map = await Promise.all(analyses)
    return new Map(map)
  }

  const timeout: number = 25_000
  const { puppeteer } = bootstrap(db)
  const analyses = queries.map(query => forMap(query, puppeteer.analyze(query, mobile, location, true, false, undefined, timeout)))
  const map = await Promise.all(analyses)

  return new Map(map)
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, { urls, mobile, fetchSW }: { urls: string | string[], mobile?: boolean | string, fetchSW?: boolean}) {
  const concatUrls = ([] as string[]).concat(urls)
  const map = await analyzeUrls(concatUrls, db, mobile === true || mobile === 'true', fetchSW)

  return [...map]
}
