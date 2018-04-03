import { BulkComparisonWorker } from './BulkComparisonWorker'
import { baqend, model } from 'baqend'

export class BulkComparisonRequest {
  constructor(private db: baqend, private createdBy: string, private tests) {
  }

  create() {
    const bulkComparison = new this.db.BulkComparison()
    bulkComparison.comparisonsToStart = this.tests
    bulkComparison.createdBy = this.createdBy
    bulkComparison.multiComparisons = []
    bulkComparison.hasFinished = false

    return bulkComparison.save()
  }
}

export function call(db, data, req) {
  const { body } = req
  const { createdBy = null } = body
  let { tests } = body
  if (body instanceof Array) {
    tests = body
  }

  const bulkComparisonRequest = new BulkComparisonRequest(db, createdBy, tests)
  const bulkComparisonWorker = new BulkComparisonWorker(db)

  return bulkComparisonRequest.create().then(bulkComparison => {
    bulkComparisonWorker.next(bulkComparison.id)
    return bulkComparison
  })
}
