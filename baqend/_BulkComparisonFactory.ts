import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'

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
  create(createdBy: string, tests: model.ComparisonInfo[]): Promise<model.BulkComparison> {
    const bulkComparison: model.BulkComparison = new this.db.BulkComparison()
    bulkComparison.comparisonsToStart = tests
    bulkComparison.createdBy = createdBy
    bulkComparison.multiComparisons = []
    bulkComparison.hasFinished = false

    return bulkComparison.save()
  }
}
