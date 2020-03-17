import { baqend, model } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'

export interface StartMultiComparisonParams extends TestParams {
  runs?: number
  createdBy?: string
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, data: StartMultiComparisonParams): Promise<model.BulkTest> {
  const { multiComparisonWorker, multiComparisonFactory, puppeteer } = bootstrap(db)

  // Get necessary options
  const { createdBy, runs, ...params } = data
  const puppeteerInfo = await puppeteer.analyze(params.url, params.mobile, params.location, true, params.preload, params.app)
  const multiComparison = await multiComparisonFactory.create(puppeteerInfo, params, createdBy, runs)
  multiComparisonWorker.next(multiComparison)

  return multiComparison
}
