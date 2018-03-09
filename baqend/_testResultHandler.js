const API = require('./Pagetest');
const { generateTestResult } = require('./resultGeneration');
const { createSmartConfig, getFallbackConfig } = require('./configGeneration');

const CONFIG_TYPE = 'config';
const PERFORMANCE_TYPE = 'performance';

class TestResultHandler {
  constructor(db) {
    this.db = db
  }

  /**
   * Handles the result of a given WPT test id.
   *
   * @param db The Baqend instance.
   * @param {string} testId The id of the WPT test to be handled.
   */
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

// const { TestWorker } = require('./_testWorker');
//
// function callResultHandler(db, data, req) {
//   db.log.info('Comparison Pingback received for ' + data.id);
//   const ComparisonResultHandler = new ComparisonResultHandler(db)
//   testResultHandler.handleTestResult(data.id)
// }
//
// exports.call = callResultHandler;
