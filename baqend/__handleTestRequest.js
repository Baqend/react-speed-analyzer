const { ComparisonWorker } = require('./_comparisonWorker');
const { TestWorker } = require('./_testWorker');
const { TestRequest } = require('./_testRequest');

exports.call = function(db, data, req) {
  const params = data

  const comparisonWorker = new ComparisonWorker(db)
  const testWorker = new TestWorker(db, comparisonWorker)
  const testRequest = new TestRequest(db, params)

  return testRequest.create().then(testResult => {
    testWorker.next(testResult.id)
    return testResult
  })
};
