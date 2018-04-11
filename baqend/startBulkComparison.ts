import { baqend, model } from 'baqend'
import { BulkComparisonTestParams } from './_BulkComparisonFactory'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'
import { UrlAnalyzer } from './_UrlAnalyzer'

/**
 * The params which are allowed per test.
 */
export interface BulkTestParams extends TestParams {
  url: string
  runs?: number
}

type StartBulkComparisonParams = BulkTestParams[] | {
  tests: BulkTestParams[]
  createdBy?: string
}

async function buildTest(urlAnalyzer: UrlAnalyzer, testParams: BulkTestParams): Promise<BulkComparisonTestParams> {
  const { url, ...params } = testParams
  const urlInfo = await urlAnalyzer.analyzeUrl(url, params.mobile)
  if (!urlInfo) {
    throw new Error(`Could not analyze URL: ${url}`)
  }

  return Object.assign({}, params, { urlInfo })
}

function buildTests(urlAnalyzer: UrlAnalyzer, params: BulkTestParams[]): Promise<BulkComparisonTestParams[]> {
  return Promise.all(params.map(param => buildTest(urlAnalyzer, param)))
}

export async function startBulkComparison(db: baqend, createdBy: string | null, data: BulkTestParams[]): Promise<model.BulkComparison> {
  const { bulkComparisonWorker, bulkComparisonFactory, urlAnalyzer } = bootstrap(db)

  const tests = await buildTests(urlAnalyzer, data)
  const bulkComparison = await bulkComparisonFactory.create(createdBy, tests)
  bulkComparisonWorker.next(bulkComparison)

  return bulkComparison
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, data: StartBulkComparisonParams): Promise<model.BulkComparison> {
  if (data instanceof Array) {
    return startBulkComparison(db, null, data)
  }

  const { tests, createdBy = null } = data
  return startBulkComparison(db, createdBy, tests)
}
