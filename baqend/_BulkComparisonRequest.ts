import { baqend, model } from 'baqend'
import { AnalyzerRequest } from './_AnalyzerRequest'

/**
 * A request to start a bulk comparison.
 */
export class BulkComparisonRequest implements AnalyzerRequest<model.BulkComparison> {
  constructor(private db: baqend, private createdBy: string, private tests: model.ComparisonInfo[]) {
  }

  create(): Promise<model.BulkComparison> {
    const bulkComparison: model.BulkComparison = new this.db.BulkComparison()
    bulkComparison.comparisonsToStart = this.tests
    bulkComparison.createdBy = this.createdBy
    bulkComparison.multiComparisons = []
    bulkComparison.hasFinished = false

    return bulkComparison.save()
  }
}
