import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { sleep } from './_sleep'

const ONE_MINUTE = 1000 * 60
const ONE_DAY = ONE_MINUTE * 60 * 24

/**
 * Executed by the Cronjob.
 */
export async function run(db: baqend) {
  const { testWorker } = bootstrap(db)

  db.log.info('Running cronTestWorker job')

  const now = Date.now()
  const tests = await db.TestResult.find()
    .equal('hasFinished', false)
    .notEqual('url', null)
    .lessThanOrEqualTo('updatedAt', new Date(now - ONE_MINUTE))
    .greaterThanOrEqualTo('updatedAt', new Date(now - ONE_DAY))
    .isNotNull('webPagetests')
    .resultList()

  for (const test of tests) {
    db.log.info(`Running cronTestWorker job for test ${test.key}`)

    await test.save()
    await testWorker.next(test)
    await sleep(1000)
  }
}
