import { ComparisonWorker } from './ComparisonWorker'

export function call(db, jobsStatus, jobsDefinition) {
  const comparisonWorker = new ComparisonWorker(db)
  const date = new Date()

  db.TestOverview.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60))
    .greaterThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60 * 60))
    .resultList(testOverviews => {
      db.log.info("Running comparison worker job", testOverviews)
      testOverviews.map(testOverview => {
        // testResult.retries = testResult.retries >= 0 ? testResult.retries + 1 : 0
        // testOverview.save().then(() => testWorker.next(testResult.id))
        comparisonWorker.next(testOverview.id)
        // testResult.save()
      })
    })
}
