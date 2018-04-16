import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { OptUrlInfo } from './_UrlInfo'

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
export async function analyzeUrls(queries: string[], db: baqend, mobile: boolean = false): Promise<Map<string, OptUrlInfo>> {
  const { urlAnalyzer } = bootstrap(db)

  return urlAnalyzer.analyzeUrls(queries, mobile)
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, { urls, mobile }: { urls: string | string[], mobile?: boolean | string }) {
  const concatUrls = ([] as string[]).concat(urls)
  const map = await analyzeUrls(concatUrls, db, mobile === true || mobile === 'true')

  return [...map]
}
