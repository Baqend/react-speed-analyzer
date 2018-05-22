import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { bootstrap } from './_compositionRoot'
import { Status } from './_Status'
import { BulkComparisonWorker } from './_BulkComparisonWorker'

/**
 * Baqend code API call.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { bulkComparisonWorker } = bootstrap(db)

  iterateBulkComparisons(db, bulkComps => killBulkComparisons(bulkComparisonWorker, bulkComps))
}


async function killBulkComparisons(bulkComparisonWorker: BulkComparisonWorker, bulkComparisons: model.BulkComparison[]): Promise<void> {
  for (const bulkComparison of bulkComparisons) {
    try {
      await bulkComparisonWorker.cancel(bulkComparison)
    } catch (error) {
    }
  }
}

async function iterateBulkComparisons(db: baqend, callback: (chunk: model.BulkComparison[]) => Promise<void>, lastId: string = '') {
  const queryBuilder = db.BulkComparison.find()
    .equal('status', Status.RUNNING)
    .notEqual('createdBy', 'plesk')

  const query = lastId.length ? queryBuilder.greaterThan('_id', lastId) : queryBuilder

  const result = await query
    .sort('_id')
    .limit(100)
    .resultList({ depth: 2 })

  if (!result.length) {
    return
  }
  await callback(result)

  iterateBulkComparisons(db, callback, result[result.length - 1].id)
}
