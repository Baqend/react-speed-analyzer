import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { TestBuilder } from './_TestBuilder'
import { TestParams } from './_TestParams'
import { UrlInfo } from './_UrlInfo'

/**
 * The params which are allowed per test.
 */
export interface BulkComparisonTestParams extends TestParams {
  urlInfo: UrlInfo
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
  create(createdBy: string | null, tests: BulkComparisonTestParams[]): Promise<model.BulkComparison> {
    const bulkComparison: model.BulkComparison = new this.db.BulkComparison()
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
    const { urlInfo, ...params } = test
    const isStarted = false

    return Object.assign(this.testBuilder.buildBulkParams(params), { urlInfo, isStarted })
  }
}
