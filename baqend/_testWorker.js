const API = require('./Pagetest');

const { TestRequestHandler } = require('./_testRequestHandler')
const { TestResultHandler } = require('./_testResultHandler')

const { getMinimalConfig, getFallbackConfig } = require('./configGeneration');
const { createTestScript } = require('./createTestScript');

const credentials = require('./credentials');
const PING_BACK_URL = `https://${credentials.app}.app.baqend.com/v1/code/_handleTestResult`;

const prewarmOptions = {
  runs: 2,
  timeline: false,
  video: false,
  firstViewOnly: true,
  minimalResults: true
}

class TestWorker {
  constructor(db) {
    this.db = db
    this.testRequestHandler = new TestRequestHandler(db)
    this.testResultHandler = new TestResultHandler(db)
  }

  next(testResultId) {
    this.db.log.info("callTestWorker", testResultId)
    this.db.TestResult.load(testResultId, { refresh: true })
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

  handleTestRequest(params) {
    return this.testRequestHandler.handleRequest(params)
      .then(testResult => {
        this.next(testResult.id)
        return testResult
      })
  }

  handleTestResult(testResultId) {
    return this.testResultHandler.handleResult(testResultId)
      .then(testResult => {
        this.next(testResult.id)
        return testResult
      })
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
        test.statusCode === 200 && this.handleTestResult(testId)
      })
    }
    testResult.webPagetests.filter(wpt => !wpt.hasFinished).map(wpt => checkWebPagetestStatus(wpt.testId))
  }

  startPrewarmWebPagetest(testResult) {
    const { speedKitConfig, testInfo } = testResult
    const { testOptions } = testInfo
    const prewarmTestScript = this.getScriptForConfig(speedKitConfig, testInfo);
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
    const configTestScript = this.getTestScriptWithMinimalWhitelist(testInfo);
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
    const performanceTestScript = this.getScriptForConfig(speedKitConfig, testInfo)
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

  getScriptForConfig(config, { url, isSpeedKitComparison, isTestWithSpeedKit, activityTimeout, testOptions }) {
    config = config || getFallbackConfig(this.db, url, testOptions.mobile);
    return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout);
  }

  getTestScriptWithMinimalWhitelist({ url, isTestWithSpeedKit, isSpeedKitComparison, activityTimeout, testOptions }) {
    const config = getMinimalConfig(this.db, url, testOptions.mobile);
    return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout);
  }
}

exports.TestWorker = TestWorker;

function callTestWorker(db, testResultId) {
  // const testResultHandler = new TestResultHandler(db)
  const testWorker = new TestWorker(db)
  testWorker.next(testResultId)
}

function runTestWorker(db, jobsStatus, jobsDefinition) {
  db.log.info('Running callTestWorker job');
  // const testResultHandler = new TestResultHandler(db)
  const testWorker = new TestWorker(db)

  const date = new Date()
  // date.setMinutes(date.getMinutes() - 1)

  db.TestResult.find()
    .equal('hasFinished', false)
    .lessThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60))
    // .greaterThanOrEqualTo('checked', new Date(date.getTime() + 1000 * 120))
    .isNotNull('webPagetests')
    .resultList(testResults => {
      db.log.info("job testResults", testResults)
      testResults.map(testResult => {
        testResult.retries = testResult.retries >= 0 ? testResult.retries + 1 : 0
        testResult.checked = new Date()
        // testResult.save().then(() => testWorker.next(testResult.id))
        testResult.save()
      })
    })
}

exports.callTestWorker = callTestWorker;
exports.run = runTestWorker;
