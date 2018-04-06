import { baqend } from 'baqend'
import { ComparisonWorker } from './ComparisonWorker'
import { TestWorker } from './TestWorker'
import { MultiComparisonWorker } from './MultiComparisonWorker'
import { BulkComparisonWorker } from './BulkComparisonWorker'

export function call(db: baqend, data: any) {
  db.log.info('Pingback for test ', { data })

  // Create all possible necessary workers
  const testWorker = new TestWorker(db)
  const comparisonWorker = new ComparisonWorker(db, testWorker)
  const multiComparisonWorker = new MultiComparisonWorker(db, comparisonWorker)
  new BulkComparisonWorker(db, multiComparisonWorker)

  return testWorker.handleWebPagetestResult(data.id)
}
