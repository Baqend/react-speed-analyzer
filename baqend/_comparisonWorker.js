// /* eslint-disable comma-dangle, function-paren-newline */
// /* eslint-disable no-restricted-syntax, no-param-reassign */
// const { isRateLimited } = require('./rateLimiter');
// const { queueTest, DEFAULT_ACTIVITY_TIMEOUT } = require('./queueTest');
// const { getTLD } = require('./getSpeedKitUrl');
// const { generateUniqueId } = require('./generateUniqueId');
// const { callPageSpeed } = require('./callPageSpeed');
// const { factorize } = require('./updateBulkComparison');
//
const { TestWorker } = require('./_testWorker')
const { TestResultHandler } = require('./_testResultHandler')
const { factorize } = require('./updateBulkComparison');

class ComparisonWorker {
  constructor(db) {
    this.db = db
    this.testWorker = new TestWorker(db, this)
    this.testResultHandler = new TestResultHandler(db)
  }

  next(testOverviewId) {
    this.db.log.info("ComparisonWorker next", testOverviewId)

    db.TestOverview.load(testOverviewId, {depth: 1}).then((testOverview) => {
      const competitorTest = testOverview.competitorTestResult;
      const speedKitTest = testOverview.speedKitTestResult;

      if(competitorTest.hasFinished && speedKitTest.hasFinished) {
        testOverview.hasFinished = true;
        testOverview.factors = this.calculateFactors(competitorTest, speedKitTest);
        testOverview.ready().then(() => testOverview.save());
      }
    })
  }

  handleTestResult(testResultId) {
    return this.testResultHandler.handleResult(testResultId)
      .then(testOverview => {
        this.next(testOverview.id)
        return testOverview
      })
  }

  calculateFactors(compResult, skResult) {
    if (skResult.testDataMissing || compResult.testDataMissing || !compResult.firstView || ! skResult.firstView) {
      return null;
    }

    return factorize(this.db, compResult.firstView, skResult.firstView);
  }
}

exports.ComparisonWorker = ComparisonWorker

// function callComparisonWorker(db, testResultId) {
//   const testWorker = new ComparisonWorker(db)
//   ComparisonWorker.next(testResultId)
// }
//
// function runTestWorker(db, jobsStatus, jobsDefinition) {
//   db.log.info('Running comparison worker job');
// }

// exports.callComparisonWorker = callComparisonWorker;
// exports.run = runTestWorker;
