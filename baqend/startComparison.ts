import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'

interface StartComparisonParams extends TestParams {
  url: string
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, data: StartComparisonParams) {
  const { comparisonWorker, comparisonFactory, urlAnalyzer } = bootstrap(db)

  // Get necessary options
  const { url, ...params } = data
  const urlInfo = await urlAnalyzer.analyzeUrl(url, params.mobile)
  if (!urlInfo) {
    throw new Error(`Could not analyze URL: ${url}`)
  }

  const comparison = await comparisonFactory.create(urlInfo, params)
  comparisonWorker.next(comparison).catch((err) => db.log.error(err.message, err))

  return comparison
}
