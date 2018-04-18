import { baqend, model } from 'baqend'
import { BulkComparisonTestParams } from './_BulkComparisonFactory'
import { bootstrap } from './_compositionRoot'
import { Puppeteer } from './_Puppeteer'
import { TestParams } from './_TestParams'

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

async function buildTest(puppeteer: Puppeteer, testParams: BulkTestParams): Promise<BulkComparisonTestParams> {
  const { url, ...params } = testParams
  const puppeteerInfo = await puppeteer.analyze(url)

  return Object.assign({}, params, { puppeteer: puppeteerInfo })
}

function buildTests(puppeteer: Puppeteer, params: BulkTestParams[]): Promise<BulkComparisonTestParams[]> {
  return Promise.all(params.map(param => buildTest(puppeteer, param)))
}

export async function startBulkComparison(db: baqend, createdBy: string | null, data: BulkTestParams[]): Promise<model.BulkComparison> {
  const { bulkComparisonWorker, bulkComparisonFactory, puppeteer } = bootstrap(db)

  const tests = await buildTests(puppeteer, data)
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
