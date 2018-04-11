import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'

export async function call(db: baqend, data: any) {
  const { comparisonWorker, comparisonFactory } = bootstrap(db)

  const comparison = await comparisonFactory.create(data)
  comparisonWorker.next(comparison).catch((err) => db.log.error(err.message, err))

  return comparison
}
