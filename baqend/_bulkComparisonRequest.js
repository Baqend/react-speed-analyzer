const { BulkComparisonWorker } = require('./_bulkComparisonWorker')

class BulkComparisonRequest {
  constructor(db, createdBy, tests) {
    this.db = db
    this.createdBy = createdBy
    this.tests = tests
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

exports.BulkComparisonRequest = BulkComparisonRequest

exports.call = function(db, data, req) {
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
