const { ComparisonRequest } = require('./_comparisonRequest');
const { ComparisonWorker } = require('./_comparisonWorker');
const { TestWorker } = require('./_testWorker');

exports.call = function(db, data, req) {
  const params = data

  const comparisonWorker = new ComparisonWorker(db)
  const testWorker = new TestWorker(db, comparisonWorker)
  const comparisonRequest = new ComparisonRequest(db, params)

  return comparisonRequest.create().then(testOverview => {
    comparisonWorker.next(testOverview.id)
    testWorker.next(testOverview.competitorTestResult.id)
    testWorker.next(testOverview.speedKitTestResult.id)
    return testOverview
  })
};
