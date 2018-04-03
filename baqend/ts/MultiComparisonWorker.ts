import { BulkComparisonWorker } from './BulkComparisonWorker'
import { startComparison } from './startComparison'

export class MultiComparisonWorker {
  constructor(private db, private bulkComparisonWorker: BulkComparisonWorker) {
  }

  next(multiComparisonId) {
    this.db.log.info("MultiComparisonWorker next", multiComparisonId)
    this.db.BulkTest.load(multiComparisonId, {depth: 1})
      .then(multiComparison => multiComparison.ready().then(() => {
        const { testOverviews, runs } = multiComparison
        const currentTestOverview = testOverviews[testOverviews.length - 1]
        if (testOverviews.length < 1 || currentTestOverview.hasFinished) {
          if (testOverviews.length === runs) {
            multiComparison.hasFinished = true
            multiComparison.ready().then(() => multiComparison.save())

            this.getBulkComparisonId(multiComparison.id).then(bulkComparisonId => {
              if (bulkComparisonId) {
                this.bulkComparisonWorker.next(bulkComparisonId)
              }
            })
          } else {
            startComparison(this.db, multiComparison.params).then(testOverview => {
              multiComparison.testOverviews.push(testOverview)
              multiComparison.ready().then(() => multiComparison.save())
            })
          }
        }
      }))
      .catch(error => this.db.log.warn(`Error while next iteration`, {id: multiComparisonId, error: error.stack}))
  }

  getBulkComparisonId(multiComparisonId) {
    return this.db.BulkComparison.find().in('multiComparisons', multiComparisonId).singleResult(bulkComparison => {
      return !bulkComparison ? null : bulkComparison.id
    })
  }
}
