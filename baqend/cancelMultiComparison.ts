import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { bootstrap } from './_compositionRoot'

/**
 * Baqend code API call.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { multiComparisonWorker } = bootstrap(db)

  const { id } = req.body
  const multiComparison: model.BulkTest = await db.BulkTest.load(id, { depth: true })
  const success = await multiComparisonWorker.cancel(multiComparison)

  res.send({ id, success })
}
