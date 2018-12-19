import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'

const ONE_MINUTE = 1000 * 60
const TWENTY_MINUTES = ONE_MINUTE * 20
const TWO_DAYS = ONE_MINUTE * 60 * 24 * 2

/**
 * Executed by the Cronjob.
 */
export async function run(db: baqend) {
  const { bulkComparisonWorker } = bootstrap(db)

  const now = Date.now()
  // Ascending by "updatedAt" to start at the head of the queue.
  const bulkComparisons = await db.BulkComparison.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(now - TWENTY_MINUTES))
    .greaterThanOrEqualTo('updatedAt', new Date(now - TWO_DAYS))
    .ascending('updatedAt')
    .resultList({ depth: 1 })

  db.log.info('Running bulkComparisonWorker job', { count: bulkComparisons.length, bulkComparisons: bulkComparisons })

  for (const bulkComparison of bulkComparisons) {
    db.log.info(`Running bulkComparisonWorker job for comparison ${bulkComparison.key}`)
    await bulkComparisonWorker.next(bulkComparison)
  }
}
