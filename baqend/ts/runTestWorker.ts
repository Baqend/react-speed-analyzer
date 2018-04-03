import { ComparisonWorker } from './ComparisonWorker'
import { TestWorker } from './TestWorker'

export function run(db, jobsStatus, jobsDefinition) {
  db.log.info("Running callTestWorker job")
  const comparisonWorker = new ComparisonWorker(db)
  const testWorker = new TestWorker(db, comparisonWorker)

  const date = new Date()

  db.TestResult.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60))
    .greaterThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60 * 60))
    .isNotNull('webPagetests')
    .resultList(testResults => {
      db.log.info("Running callTestWorker job for", testResults)
      testResults.map(testResult => {
        testResult.retries = testResult.retries >= 0 ? testResult.retries + 1 : 0
        testResult.save().then(() => testWorker.next(testResult.id))
      })
    })
}
