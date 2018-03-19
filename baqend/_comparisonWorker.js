// /* eslint-disable comma-dangle, function-paren-newline */
// /* eslint-disable no-restricted-syntax, no-param-reassign */
const { TestWorker } = require('./_testWorker')
const { factorize } = require('./updateBulkComparison');
const { callPageSpeed } = require('./callPageSpeed');

const PSI_TYPE = 'psi';

/**
 * The ComparisonWorker takes care of finishing a comparison. It can be either called manually
 * or via cronjob by passing a testOverviewId into its next method.
 * The worker will load the testOverview and check what to do next in order to finish the task.
 * The next method is called by the TestWorker, when a testResult is finished
 *
 * @return {TestWorker}
 */
class ComparisonWorker {
  constructor(db) {
    this.db = db
    this.testWorker = new TestWorker(db, this)
  }

  next(testOverviewId) {
    this.db.log.info("ComparisonWorker next", testOverviewId)

    this.db.TestOverview.load(testOverviewId, {depth: 1}).then((testOverview) => {
      const { competitorTestResult, speedKitTestResult } = testOverview;

      if (this.shouldStartPageSpeedInsights(testOverview)) {
        this.setPsiMetrics(testOverview);
        testOverview.tasks.push(new this.db.Task({
          taskType: PSI_TYPE,
          lastExecution: new Date()
        }));
      }

      // Finish testOverview
      if (competitorTestResult.hasFinished && speedKitTestResult.hasFinished) {
        testOverview.speedKitConfig = speedKitTestResult.speedKitConfig;
        testOverview.factors = this.calculateFactors(competitorTestResult, speedKitTestResult);
        testOverview.hasFinished = true;
      }

      testOverview.ready().then(() => testOverview.save());
    })
  }

  handleTestResult(testResultId) {
    this.db.log.info("handle comparison result", testResultId)
    return this.loadTestOverview(testResultId)
      .then(testOverview => {
        this.next(testOverview.id)
        return testOverview
      })
      .catch(error => this.db.log.error(`Error while handling test result`, {id: testResultId, error: error.stack}))
  }

  calculateFactors(compResult, skResult) {
    if (skResult.testDataMissing || compResult.testDataMissing || !compResult.firstView || ! skResult.firstView) {
      return null;
    }

    try {
      return factorize(this.db, compResult.firstView, skResult.firstView);
    } catch(e) {
      this.db.log.warn(`Could not calculate factors for overview with competitor ${compResult.id}`)
      return null;
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
        this.db.log.warn(`Could not call page speed insights`, { url, mobile, error: error.stack })
      });
  }

  shouldStartPageSpeedInsights(testOverview) {
    if (!testOverview.tasks || !testOverview.tasks.length) {
      return true
    }
    return testOverview.tasks.map(task => task.taskType).indexOf(PSI_TYPE) === -1
  }


  loadTestOverview(testResultId) {
    return this.db.TestOverview.find()
      .where({
        "$or": [
          { "competitorTestResult": { "$eq" : testResultId } },
          { "speedKitTestResult": { "$eq" : testResultId } }
        ]
      }).singleResult().then(testOverview => {
        this.db.log.info("Comparison found to handle test result", testOverview)
        return testOverview
      })
  }
}

exports.ComparisonWorker = ComparisonWorker

// function callComparisonWorker(db, testResultId) {
//   const testWorker = new ComparisonWorker(db)
//   ComparisonWorker.next(testResultId)
// }

function runTestWorker(db, jobsStatus, jobsDefinition) {
  const comparisonWorker = new ComparisonWorker(db)

  const date = new Date()

  db.TestResult.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60))
    .greaterThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60 * 60))
    .resultList(testOverviews => {
      db.log.info("Running comparison worker job", testOverviews)
      testOverviews.map(testOverview => {
        // testResult.retries = testResult.retries >= 0 ? testResult.retries + 1 : 0
        // testOverview.save().then(() => testWorker.next(testResult.id))
        comparisonWorker.next(testOverview.id)
        // testResult.save()
      })
    })
}

// exports.callComparisonWorker = callComparisonWorker;
exports.run = runTestWorker;
