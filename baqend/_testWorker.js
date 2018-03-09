const API = require('./Pagetest');

const { WebPagetestResultHandler } = require('./_webPagetestResultHandler')

const { getMinimalConfig, getFallbackConfig } = require('./configGeneration');
const { createTestScript } = require('./createTestScript');

const credentials = require('./credentials');
const PING_BACK_URL = `https://${credentials.app}.app.baqend.com/v1/code/__handleTestResult`;

const prewarmOptions = {
  runs: 2,
  timeline: false,
  video: false,
  firstViewOnly: true,
  minimalResults: true
}

class TestWorker {
  constructor(db, comparisonWorker) {
    this.db = db
    this.comparisonWorker = comparisonWorker
    this.testResultHandler = new WebPagetestResultHandler(db)
  }

  next(testResultId) {
    this.db.log.info("testWorker next", testResultId)
    this.db.TestResult.load(testResultId, { refresh: true })
      .then(testResult => testResult.ready().then(() => {
        if (testResult.hasFinished) {
          this.db.log.info(`TestResult is finished`, { testResult })
          // escalateToComparisonWorker(testResult.testOverview)
          // this.comparisonWorker.next(testResult.id)
          this.comparisonWorker.handleTestResult(testResult.id)
        }
        if (testResult.isClone) {
          if (this.shouldStartPreparationTests(testResult)) {
            !testResult.speedKitConfig && this.startConfigGenerationWebPagetest(testResult)
            this.startPrewarmWebPagetest(testResult)
          } else {
            if (this.hasNotFinishedWebPagetests(testResult)) {
              this.db.log.info(`checkWebPagetestStatus`, { testResult })
              this.checkWebPagetestsStatus(testResult)
            } else if (this.shouldStartPerformanceTests(testResult)) {
              this.db.log.info(`startPerformanceTest`, { testResult })
              this.startPerformanceWebPagetest(testResult)
            }
          }
        } else {
          if (this.shouldStartPerformanceTests(testResult)) {
            this.startPerformanceWebPagetest(testResult)
          }
        }
      }))
      .catch(error => this.db.log.warn(`Could not find testResult`, {id: testResultId, error: error.stack}))
  }

  handleWebPagetestResult(testId) {
    return this.testResultHandler.handleResult(testId)
      .then(testResult => {
        this.db.log.info("handleTestResult next", { testId })
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
    this.db.log.info("checkWebPagetestsStatus next", { testResult })
    const checkWebPagetestStatus = (testId) => {
      return API.getTestStatus(testId).then(test => {
        if (test.statusCode === 200) {
          return Promise.resolve(this.testResultHandler.handleResult(testId))
        }
        return Promise.reject(false)
      })
    }
    const checks = testResult.webPagetests.filter(wpt => !wpt.hasFinished).map(wpt => checkWebPagetestStatus(wpt.testId))
    Promise.all(checks).then(() => this.next(testResult.id)).catch((e) => this.db.log.info("errrrrrr", e))
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
    }
    return testResult.ready().then(() => testResult.save())
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

const { ComparisonWorker } = require('./_comparisonWorker')

function runTestWorker(db, jobsStatus, jobsDefinition) {
  db.log.info('Running callTestWorker job');
  const comparisonWorker = new ComparisonWorker(db)
  const testWorker = new TestWorker(db, comparisonWorker)

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
        testResult.save().then(() => testWorker.next(testResult.id))
        // testResult.save()
      })
    })
}

// exports.callTestWorker = callTestWorker;
exports.run = runTestWorker;
