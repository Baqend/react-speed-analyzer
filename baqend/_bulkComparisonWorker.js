const { MultiComparisonRequest } = require('./_multiComparisonRequest')
const { MultiComparisonWorker } = require('./_multiComparisonWorker')

class BulkComparisonWorker {
  constructor(db) {
    this.db = db
    this.multiComparisonWorker = new MultiComparisonWorker(db, this)
  }

  next(bulkComparisonId) {
    this.db.log.info("BulkComparisonWorker next", bulkComparisonId)
    this.db.BulkComparison.load(bulkComparisonId, {depth: 1})
      .then(bulkComparison => bulkComparison.ready().then(() => {
        const { multiComparisons, createdBy } = bulkComparison
        const currentMultiComparison = multiComparisons[multiComparisons.length - 1]

        if (multiComparisons.length < 1 || currentMultiComparison.hasFinished) {
          const nextMultipleComparison = this.getNextMultipleComparison(bulkComparison)
          if (!nextMultipleComparison) {
            bulkComparison.hasFinished = true
            bulkComparison.ready().then(() => bulkComparison.save())
          } else {
            const multiComparisonRequest = new MultiComparisonRequest(this.db, createdBy, nextMultipleComparison)
            multiComparisonRequest.create().then(multiComparison => {
              bulkComparison.multiComparisons.push(multiComparison)
              bulkComparison.ready().then(() => bulkComparison.save())

              this.multiComparisonWorker.next(multiComparison.id)
            });
          }
        }
    }))
    .catch(error => this.db.log.warn(`Error while next iteration`, {id: bulkComparisonId, error: error.stack}))
  }

  getNextMultipleComparison(bulkComparison) {
    const { multiComparisons, comparisonsToStart } = bulkComparison

    return comparisonsToStart.find(comparison => {
      return multiComparisons.filter(multiComparison => multiComparison.url === comparison.url).length === 0
    })
  }
}

exports.BulkComparisonWorker = BulkComparisonWorker
