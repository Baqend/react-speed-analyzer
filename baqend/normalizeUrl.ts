import { baqend } from 'baqend'
import { analyzeUrls } from './analyzeUrl'

/**
 * Baqend code API call.
 */
export async function call(db: baqend, { urls, mobile }: { urls: string[], mobile?: string | boolean }) {
  const concatUrls = ([] as string[]).concat(urls)
  const results = await analyzeUrls(concatUrls, db, mobile === true || mobile === 'true')
  const filteredResults = [...results].filter(([, result]) => !!result)

  return filteredResults.map(([query, result]) => ({
    query,
    url: result!.url,
    displayUrl: result!.displayUrl,
    isBaqendApp: result!.type === 'baqend',
    isSecured: result!.secured,
    swUrl: result!.swUrl,
    speedkit: result!.enabled,
    speedkitVersion: result!.speedKitVersion,
    type: result!.type,
  }))
}
