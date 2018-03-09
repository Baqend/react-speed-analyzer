const { ComparisonWorker } = require('./_comparisonWorker')
const { TestWorker } = require('./_testWorker')

exports.call = function(db, data, req) {
  const comparisonWorker = new ComparisonWorker(db)
  const testWorker = new TestWorker(db, comparisonWorker)

  return testWorker.handleWebPagetestResult(data.id)
}
