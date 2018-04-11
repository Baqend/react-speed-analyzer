import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { DEFAULT_PARAMS } from './_ComparisonFactory'
import { DEFAULT_MULTI_PARAMS } from './_MultiComparisonFactory'
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
  constructor(private db: baqend) {
  }

  /**
   * Creates the object which is demanded by this factory.
   *
   * @return A promise which resolves with the created object.
   */
  create(createdBy: string | null, tests: BulkComparisonTestParams[]): Promise<model.BulkComparison> {
    const bulkComparison: model.BulkComparison = new this.db.BulkComparison()
    bulkComparison.comparisonsToStart = tests.map(this.buildParams)
    bulkComparison.createdBy = createdBy
    bulkComparison.multiComparisons = []
    bulkComparison.hasFinished = false

    return bulkComparison.save()
  }

  /**
   * Builds the final test params.
   */
  buildParams(test: BulkComparisonTestParams): model.ComparisonInfo {
    return Object.assign({}, DEFAULT_PARAMS, DEFAULT_MULTI_PARAMS, { runs: 1 }, test)
  }
}
