import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'

const ONE_MINUTE = 1000 * 60
const FIVE_MINUTES = ONE_MINUTE * 5
const TWO_DAYS = ONE_MINUTE * 60 * 24 * 2

/**
 * Executed by the Cronjob.
 */
export async function run(db: baqend) {
  const { multiComparisonWorker } = bootstrap(db)

  const now = Date.now()
  // Ascending by "updatedAt" to start at the head of the queue.
  const multiComparisons = await db.BulkTest.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(now - FIVE_MINUTES))
    .greaterThanOrEqualTo('updatedAt', new Date(now - TWO_DAYS))
    .ascending('updatedAt')
    .resultList({ depth: 1 })

  db.log.info('Running cronMultiComparisonWorker job', { multiComparisons: multiComparisons })

  for (const multiComparison of multiComparisons) {
    db.log.info(`Running cronMultiComparisonWorker job for comparison ${multiComparison.key}`)
    await multiComparisonWorker.next(multiComparison)
  }
}
