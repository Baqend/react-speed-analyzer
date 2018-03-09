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
const { callPageSpeed } = require('./callPageSpeed');

const PSI_TYPE = 'psi';

class ComparisonWorker {
  constructor(db) {
    this.db = db
    this.testWorker = new TestWorker(db, this)
    this.testResultHandler = new TestResultHandler(db)
  }

  next(testOverviewId) {
    this.db.log.info("ComparisonWorker next", testOverviewId)
    this.db.TestOverview.load(testOverviewId, {depth: 1}).then((testOverview) => {
      if (this.shouldStartPageSpeedInsights(testOverview)) {
        this.setPsiMetrics(testOverview);
        this.pushWebTaskToTestOverview(testOverview, new this.db.Task({
          taskType: PSI_TYPE,
          lastExecution: new Date()
        }));
      }

      this.finishTestOverview(testOverview);
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

  pushWebTaskToTestOverview(testOverview, task) {
    testOverview.tasks.push(task)
    return testOverview.ready().then(() => testOverview.save())
  }

  finishTestOverview(testOverview) {
    const { competitorTestResult, speedKitTestResult } = testOverview;
    if (competitorTestResult.hasFinished && speedKitTestResult.hasFinished) {
      testOverview.speedKitConfig = speedKitTestResult.speedKitConfig;
      testOverview.factors = this.calculateFactors(competitorTestResult, speedKitTestResult);
      testOverview.hasFinished = true;
      testOverview.ready().then(() => testOverview.save());
    }
  }

  setPsiMetrics(testOverview) {
    const { url, mobile } = testOverview;
    callPageSpeed(url, mobile)
      .then(pageSpeedInsights => {
        testOverview.psiDomains = pageSpeedInsights.domains;
        testOverview.psiRequests = pageSpeedInsights.requests;
        testOverview.psiResponseSize = pageSpeedInsights.bytes;
        testOverview.psiScreenshot = pageSpeedInsights.screenshot;
      })
      .then(() => testOverview.ready().then(() => testOverview.save()))
      .catch(error => {
        this.db.log.warn(`Could not call page speed`, { url, mobile, error: error.stack })
      });
  }

  shouldStartPageSpeedInsights(testOverview) {
    if (!testOverview.tasks || !testOverview.tasks.length) {
      return true
    }
    return testOverview.tasks.map(task => task.taskType).indexOf(PSI_TYPE) === -1
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
