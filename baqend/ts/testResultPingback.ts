import { baqend } from 'baqend'
import { ComparisonWorker } from './ComparisonWorker'
import { TestWorker } from './TestWorker'

export function call(db: baqend, data: any) {
  db.log.info('Pingback for test ', { data })
  const testWorker = new TestWorker(db)
  const comparisonWorker = new ComparisonWorker(db, testWorker)

  return testWorker.handleWebPagetestResult(data.id)
}
