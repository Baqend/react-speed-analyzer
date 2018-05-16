import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { TestBuilder } from './_TestBuilder'
import { TestParams } from './_TestParams'

/**
 * The params which are allowed per test.
 */
export interface BulkComparisonTestParams extends TestParams {
  url: string;
  runs?: number
  puppeteer: model.Puppeteer
}

/**
 * A factory to create bulk comparisons.
 */
export class BulkComparisonFactory implements AsyncFactory<model.BulkComparison> {
  constructor(
    private readonly db: baqend,
    private readonly testBuilder: TestBuilder,
  ) {
  }

  /**
   * Creates the object which is demanded by this factory.
   *
   * @return A promise which resolves with the created object.
   */
  create(id: string, createdBy: string | null, tests: BulkComparisonTestParams[]): Promise<model.BulkComparison> {
    const bulkComparison: model.BulkComparison = new this.db.BulkComparison({ id })
    bulkComparison.status = 'QUEUED'
    bulkComparison.hasFinished = false
    bulkComparison.comparisonsToStart = tests.map(this.buildParams.bind(this))
    bulkComparison.createdBy = createdBy
    bulkComparison.multiComparisons = []

    return bulkComparison.save()
  }

  /**
   * Builds the final test params.
   */
  buildParams(test: BulkComparisonTestParams): model.ComparisonInfo {
    const { puppeteer, url, ...params } = test
    const isStarted = false
    const multiComparisonId = null
    return Object.assign(this.testBuilder.buildBulkParams(params), { puppeteer, isStarted, url, multiComparisonId })
  }
}
