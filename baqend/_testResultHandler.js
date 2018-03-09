const API = require('./Pagetest');

const CONFIG_TYPE = 'config';
const PERFORMANCE_TYPE = 'performance';

/**
 * Handles a test result to continue the comparison.
 * Instance in ComparisonWorker
 * Called by TestWorker
 *
 * @return {TestResultHandler}
 */
class TestResultHandler {
  constructor(db) {
    this.db = db
  }

  handleResult(testResultId) {
    this.db.log.info("handle Comparison Result", testResultId)
    return this.db.TestOverview.find()
      .where({
        "$or": [
          { "competitorTestResult": { "$eq" : testResultId } },
          { "speedKitTestResult": { "$eq" : testResultId } }
        ]
      }).singleResult().then(testOverview => {
        this.db.log.info("handle Comparison Result Obj", testOverview)
        return testOverview
      })

  }
}

exports.TestResultHandler = TestResultHandler;
