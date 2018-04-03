import { ComparisonWorker } from './ComparisonWorker'
import { TestWorker } from './TestWorker'
import { Request } from 'express'

export function call(db, data, req: Request) {
  db.log.info('Pinkback for test ', { data })
  const comparisonWorker = new ComparisonWorker(db)
  const testWorker = new TestWorker(db, comparisonWorker)

  return testWorker.handleWebPagetestResult(data.id)
}
