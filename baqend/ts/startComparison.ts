import { baqend } from 'baqend'
import { Request } from 'express'
import { ComparisonRequest } from './ComparisonRequest'
import { ComparisonWorker } from './ComparisonWorker'
import { TestWorker } from './TestWorker'

export async function call(db: baqend, data: any) {
  const testWorker = new TestWorker(db)
  const comparisonWorker = new ComparisonWorker(db, testWorker)

  const comparisonRequest = new ComparisonRequest(db, data)

  const comparison = await comparisonRequest.create()
  comparisonWorker.next(comparison).catch((err) => db.log.error(err.message, err))

  return comparison
}
