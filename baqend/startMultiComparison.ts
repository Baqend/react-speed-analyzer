import { baqend, model } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'

export interface StartMultiComparisonParams extends TestParams {
  runs?: number
  createdBy?: string
  url: string
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, data: StartMultiComparisonParams): Promise<model.BulkTest> {
  const { multiComparisonWorker, multiComparisonFactory, puppeteer } = bootstrap(db)

  // Get necessary options
  const { url, createdBy, runs, ...params } = data
  const puppeteerInfo = await puppeteer.analyze(url, params.mobile)
  const multiComparison = await multiComparisonFactory.create(puppeteerInfo, params, createdBy, runs)
  multiComparisonWorker.next(multiComparison)

  return multiComparison
}
