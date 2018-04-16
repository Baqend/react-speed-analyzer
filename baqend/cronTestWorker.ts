import { baqend, model } from 'baqend'
import { bootstrap } from './_compositionRoot'

export function run(db: baqend, jobsStatus: model.JobStatus, jobsDefinition: model.JobDefinition) {
  const { testWorker } = bootstrap(db)
  const date = new Date()

  db.log.info('Running callTestWorker job')

  return db.TestResult.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60))
    .greaterThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60 * 60))
    .isNotNull('webPagetests')
    .resultList(testResults => {
      db.log.info('Running callTestWorker job for', testResults)
      testResults.map(testResult => {
        testResult.retries = testResult.retries >= 0 ? testResult.retries + 1 : 0
        testResult.save().then(() => testWorker.next(testResult))
      })
    })
}
