import { BulkComparisonRequest } from './BulkComparisonRequest'
import { BulkComparisonWorker } from './BulkComparisonWorker'
import { Request } from 'express'
import { baqend } from 'baqend'
import { MultiComparisonWorker } from './MultiComparisonWorker'
import { ComparisonWorker } from './ComparisonWorker'
import { TestWorker } from './TestWorker'

export async function call(db: baqend, data: any, req: Request) {
  const { body } = req
  const { createdBy = null } = body
  let { tests } = body
  if (body instanceof Array) {
    tests = body
  }

  const testWorker = new TestWorker(db)
  const comparisonWorker = new ComparisonWorker(db, testWorker)
  const multiComparisonWorker = new MultiComparisonWorker(db, comparisonWorker)
  const bulkComparisonWorker = new BulkComparisonWorker(db, multiComparisonWorker)

  const bulkComparisonRequest = new BulkComparisonRequest(db, createdBy, tests)
  const bulkComparison = await bulkComparisonRequest.create()
  bulkComparisonWorker.next(bulkComparison.id)

  return bulkComparison
}
