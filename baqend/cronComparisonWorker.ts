import { ComparisonWorker } from './_ComparisonWorker'
import { TestWorker } from './_TestWorker'
import { baqend, model } from 'baqend'

export function run(db: baqend, jobsStatus: model.JobStatus, jobsDefinition: model.JobDefinition) {
  const testWorker = new TestWorker(db)
  const comparisonWorker = new ComparisonWorker(db, testWorker)
  const date = new Date()

  db.TestOverview.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60))
    .greaterThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60 * 60))
    .resultList({ depth: 1 }, testOverviews => {
      db.log.info("Running comparison worker job", testOverviews)
      testOverviews.map(testOverview => {
        // testResult.retries = testResult.retries >= 0 ? testResult.retries + 1 : 0
        // testOverview.save().then(() => testWorker.next(testResult.id))
        comparisonWorker.next(testOverview)
        // testResult.save()
      })
    })
}
