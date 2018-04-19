import { baqend, model } from 'baqend'
import { bootstrap } from './_compositionRoot'

/**
 * Wraps a promise to be used in a map.
 */
function forMap<K, V>(key: K, deferredValue: Promise<V>): Promise<[K, V]> {
  return deferredValue.then(value => [key, value] as [K, V])
}

/**
 * Analyzes a bunch of URLs.
 * The result is given in a Map returning a result for each query sent.
 *
 * @param queries The URLs to test.
 * @param db The Baqend instance.
 * @param mobile Whether to fetch the mobile variant of the site.
 * @return A promise which resolves with the analysis's result map.
 * @template Result
 */
export async function analyzeUrls(queries: string[], db: baqend, mobile: boolean = false): Promise<Map<string, model.Puppeteer>> {
  const { puppeteer } = bootstrap(db)

  const analyses = queries.map(query => forMap(query, puppeteer.analyze(query)))
  const map = await Promise.all(analyses)

  return new Map(map)
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, { urls, mobile }: { urls: string | string[], mobile?: boolean | string }) {
  const concatUrls = ([] as string[]).concat(urls)
  const map = await analyzeUrls(concatUrls, db, mobile === true || mobile === 'true')

  return [...map]
}
