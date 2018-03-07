const { API } = require('./Pagetest');
const { getTestScriptWithMinimalWhitelist, getScriptForConfig } = require('./prewarming');

const credentials = require('./credentials');
const PING_BACK_URL = `https://${credentials.app}.app.baqend.com/v1/code/_testResultHandler`;

const prewarmOptions = {
  runs: 2,
  timeline: false,
  video: false,
  firstViewOnly: true,
  minimalResults: true
}

class TestWorker {
  constructor(db, testResultHandler = null) {
    this.db = db
    this.testResultHandler = testResultHandler
  }

  setTestResultHandler(testResultHandler) {
    this.testResultHandler = testResultHandler
  }

  resume(testResultId) {
    this.db.log.info("callTestWorker", testResultId)
    this.db.TestResult.load(testResultId)
      .then(testResult => {
        if (testResult.hasFinished) {
          this.db.log.info(`TestResult is finished`, { testResult })
          // escalateToComparisonWorker(testResult.testOverview)
        }
        if (testResult.isClone) {
          if (this.shouldStartPreparationTests(testResult)) {
            !testResult.speedKitConfig && this.startConfigGenerationWebPagetest(testResult)
            this.startPrewarmWebPagetest(testResult)
          } else {
            if (this.hasNotFinishedWebPagetests(testResult)) {
              this.checkWebPagetestsStatus(testResult)
            } else {
              this.shouldStartPerformanceTests(testResult) && this.startPerformanceWebPagetest(testResult)
            }
          }
        } else {
          this.shouldStartPerformanceTests(testResult) && this.startPerformanceWebPagetest(testResult)
        }
      })
      .catch(error => this.db.log.warn(`Could not find testResult`, {id: testResultId, error: error.stack}))
  }

  shouldStartPreparationTests(testResult) {
    if (testResult.skipPrewarm) {
      return false
    }
    return !testResult.webPagetests || !testResult.webPagetests.length
  }

  shouldStartPerformanceTests(testResult) {
    return testResult.webPagetests.map(wpt => wpt.testType).indexOf('performance') === -1
  }

  hasNotFinishedWebPagetests(testResult) {
    return testResult.webPagetests.filter(wpt => !wpt.hasFinished).length > 0
  }

  checkWebPagetestsStatus(testResult) {
    const checkWebPagetestStatus = (testId) => {
      API.getTestStatus(testId).then(test => {
        test.statusCode === 200 && this.testResultHandler && this.testResultHandler.handleTestResult(testId)
      })
    }
    testResult.webPagetests.filter(wpt => !wpt.hasFinished).map(wpt => checkWebPagetestStatus(wpt.testId))
  }

  startPrewarmWebPagetest(testResult) {
    const { speedKitConfig, testInfo } = testResult
    const { testOptions } = testInfo
    const prewarmTestScript = getScriptForConfig(speedKitConfig, testInfo);
    const prewarmTestOptions = Object.assign({ pingback: PING_BACK_URL }, testOptions, prewarmOptions);
    return API.runTestWithoutWait(prewarmTestScript, prewarmTestOptions).then(testId => {
      return this.pushWebPagetestToTestResult(testResult, new this.db.WebPagetest({
        testId: testId,
        testType: 'prewarm',
        testScript: prewarmTestScript,
        testOptions: prewarmTestOptions,
        hasFinished: false
      }))
    })
  }

  startConfigGenerationWebPagetest(testResult) {
    const { speedKitConfig, testInfo } = testResult
    const { testOptions } = testInfo;
    const configTestScript = getTestScriptWithMinimalWhitelist(testInfo);
    const configTestOptions = Object.assign({ pingback: PING_BACK_URL }, testOptions, prewarmOptions, { runs: 1 });
    return API.runTestWithoutWait(configTestScript, configTestOptions).then(testId => {
      return this.pushWebPagetestToTestResult(testResult, new this.db.WebPagetest({
        testId: testId,
        testType: 'config',
        testScript: configTestScript,
        testOptions: configTestOptions,
        hasFinished: false
      }))
    })
  }

  startPerformanceWebPagetest(testResult) {
    const { speedKitConfig, testInfo } = testResult
    const { testOptions } = testInfo
    const performanceTestScript = getScriptForConfig(speedKitConfig, testInfo)
    const performanceTestOptions = Object.assign({ pingback: PING_BACK_URL }, testOptions)
    return API.runTestWithoutWait(performanceTestScript, performanceTestOptions).then(testId => {
      return this.pushWebPagetestToTestResult(testResult, new this.db.WebPagetest({
        testId: testId,
        testType: 'performance',
        testScript: performanceTestScript,
        testOptions: performanceTestOptions,
        hasFinished: false
      }))
    })
  }

  pushWebPagetestToTestResult(testResult, WebPagetest) {
    testResult.webPagetests.push(WebPagetest)
    if (testResult._metadata.isReady) {
      return testResult.save()
    } else {
      return testResult.ready().then(() => testResult.save())
    }
  }
}

exports.TestWorker = TestWorker;

const { TestResultHandler } = require('./_testResultHandler')

function callTestWorker(db, testResultId) {
  const testResultHandler = new TestResultHandler(db)
  const testWorker = new TestWorker(db, testResultHandler)
  testResultHandler.setTestWorker(testWorker)
  testWorker.resume(testResultId)
}

function runTestWorker(db, jobsStatus, jobsDefinition) {
  db.log.info('Running callTestWorker job');
  const testResultHandler = new TestResultHandler(db)
  const testWorker = new TestWorker(db, testResultHandler)
  testResultHandler.setTestWorker(testWorker)

  const date = new Date()
  date.setMinutes(date.getMinutes() - 1)

  db.TestResult.find()
    .equal('hasFinished', false)
    .lessThan('updatedAt', date)
    .isNotNull('webPagetests')
    .resultList(testResults => {
      testResults.map(testResult => testWorker.resume(testResult.id))
    })
}

exports.callTestWorker = callTestWorker;
exports.run = runTestWorker;
