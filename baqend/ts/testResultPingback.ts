import { baqend } from 'baqend'
import { ComparisonWorker } from './ComparisonWorker'
import { TestWorker } from './TestWorker'

export function call(db: baqend, data) {
  db.log.info('Pingback for test ', { data })
  const comparisonWorker = new ComparisonWorker(db)
  const testWorker = new TestWorker(db, comparisonWorker)

  return testWorker.handleWebPagetestResult(data.id)
}
