const { TestWorker } = require('./_testWorker')

exports.call = function(db, data, req) {
  db.log.info('_handleTestResult Pingback received for ' + data.id);
  const testWorker = new TestWorker(db)
  return testWorker.handleTestResult(data.id)
}
