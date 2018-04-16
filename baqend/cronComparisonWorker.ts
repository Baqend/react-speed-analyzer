import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'

const ONE_MINUTE = 1000 * 60
const ONE_DAY = ONE_MINUTE * 60 * 24

/**
 * Executed by the Cronjob.
 */
export async function run(db: baqend) {
  const { comparisonWorker } = bootstrap(db)

  const now = Date.now()
  const comparisons = await db.TestOverview.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(now - ONE_MINUTE))
    .greaterThanOrEqualTo('updatedAt', new Date(now - ONE_DAY))
    .resultList({ depth: 1 })

  db.log.info('Running cronComparisonWorker job', { comparisons })

  for (const comparison of comparisons) {
    db.log.info(`Running cronComparisonWorker job for comparison ${comparison.key}`)
    await comparisonWorker.next(comparison)
  }
}
