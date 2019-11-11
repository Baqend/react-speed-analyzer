import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'

const ONE_MINUTE = 1000 * 60
const TWO_MINUTES = ONE_MINUTE * 2
const TWO_DAYS = ONE_MINUTE * 60 * 24 * 2

/**
 * Executed by the Cronjob.
 */
export async function run(db: baqend) {
  const { comparisonWorker } = bootstrap(db)

  const now = Date.now()
  // Ascending by "updatedAt" to start at the head of the queue.
  const comparisons = await db.TestOverview.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(now - TWO_MINUTES))
    .greaterThanOrEqualTo('updatedAt', new Date(now - TWO_DAYS))
    .ascending('updatedAt')
    .resultList({ depth: 1 })

  db.log.info('Running cronComparisonWorker job', { comparisons })

  for (const comparison of comparisons) {
    db.log.info(`Running cronComparisonWorker job for comparison ${comparison.key}`)
    await comparisonWorker.next(comparison)
  }
}
