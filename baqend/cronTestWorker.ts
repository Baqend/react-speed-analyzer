import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { sleep } from './_sleep'

const ONE_MINUTE = 1000 * 60
const TWO_DAYS = ONE_MINUTE * 60 * 24 * 2

/**
 * Executed by the Cronjob.
 */
export async function run(db: baqend) {
  const { testWorker } = bootstrap(db)

  db.log.info('Running cronTestWorker job')

  const now = Date.now()
  // Ascending by "updatedAt" to start at the head of the queue.
  const tests = await db.TestResult.find()
    .equal('hasFinished', false)
    .notEqual('url', null)
    .lessThanOrEqualTo('updatedAt', new Date(now - ONE_MINUTE))
    .greaterThanOrEqualTo('updatedAt', new Date(now - TWO_DAYS))
    .isNotNull('webPagetests')
    .ascending('updatedAt')
    .resultList()

  for (const test of tests) {
    db.log.info(`Running cronTestWorker job for test ${test.key}`)

    await test.save()
    await testWorker.next(test)
    await sleep(1000)
  }
}
