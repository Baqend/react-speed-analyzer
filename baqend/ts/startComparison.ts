import { ComparisonRequest } from './ComparisonRequest'
import { ComparisonWorker } from './ComparisonWorker'
import { TestWorker } from './TestWorker'

export function startComparison(db, params) {
  const comparisonWorker = new ComparisonWorker(db)
  const testWorker = new TestWorker(db, comparisonWorker)

  const comparisonRequest = new ComparisonRequest(db, params)

  return comparisonRequest.create().then(testOverview => {
    comparisonWorker.next(testOverview.id)
    testWorker.next(testOverview.competitorTestResult.id)
    testWorker.next(testOverview.speedKitTestResult.id)
    return testOverview
  })
}

export function call(db, data, req) {
  return startComparison(db, data)
}
