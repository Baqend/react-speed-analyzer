import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { TestBuilder } from './_TestBuilder'
import { TestParams } from './_TestParams'

/**
 * The params which are allowed per test.
 */
export interface BulkComparisonTestParams extends TestParams {
  puppeteer: model.Puppeteer
  runs?: number
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
    bulkComparison.comparisonsToStart = tests.map(this.buildParams.bind(this))
    bulkComparison.createdBy = createdBy
    bulkComparison.multiComparisons = []
    bulkComparison.hasFinished = false

    return bulkComparison.save()
  }

  /**
   * Builds the final test params.
   */
  buildParams(test: BulkComparisonTestParams): model.ComparisonInfo {
    const { puppeteer, ...params } = test
    const isStarted = false

    return Object.assign(this.testBuilder.buildBulkParams(params), { puppeteer, isStarted })
  }
}
