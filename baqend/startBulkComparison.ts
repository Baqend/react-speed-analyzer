import { Request } from 'express'
import { baqend, model } from 'baqend'
import { bootstrap } from './_compositionRoot'

export async function startBulkComparison(db: baqend, createdBy: string, tests: model.ComparisonInfo[]): Promise<model.BulkComparison> {
  const { bulkComparisonWorker, bulkComparisonFactory } = bootstrap(db)

  const bulkComparison = await bulkComparisonFactory.create(createdBy, tests)
  bulkComparisonWorker.next(bulkComparison)

  return bulkComparison
}

export async function call(db: baqend, data: any, req: Request): Promise<model.BulkComparison> {
  const { body } = req
  const { createdBy = null } = body
  let { tests } = body
  if (body instanceof Array) {
    tests = body
  }

  return startBulkComparison(db, createdBy, tests)
}
