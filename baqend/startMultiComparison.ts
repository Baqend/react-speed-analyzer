import { Request } from 'express'
import { baqend, model } from 'baqend'
import { bootstrap } from './_compositionRoot'

export async function startMultiComparison(db: baqend, createdBy: string, tests: model.ComparisonInfo): Promise<model.BulkTest> {
  const { multiComparisonWorker, multiComparisonFactory } = bootstrap(db)

  const multiComparison = await multiComparisonFactory.create(createdBy, tests)
  multiComparisonWorker.next(multiComparison)

  return multiComparison
}

export async function call(db: baqend, data: any, req: Request): Promise<model.BulkTest> {
  const { body } = req
  const { createdBy = null, test } = body

  return startMultiComparison(db, createdBy, test)
}
