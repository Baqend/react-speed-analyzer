const API = require('./Pagetest');

const { WebPagetestResultHandler } = require('./_webPagetestResultHandler')

const { getMinimalConfig, getFallbackConfig } = require('./configGeneration');
const { createTestScript } = require('./createTestScript');

const credentials = require('./credentials');
const PING_BACK_URL = `https://${credentials.app}.app.baqend.com/v1/code/_testResultPingback`;

const prewarmOptions = {
  runs: 2,
  timeline: false,
  video: false,
  firstViewOnly: true,
  minimalResults: true
}

/**
 * The TestWorker takes care of finishing the tests that are running for a comparison. It can
 * be either called manually or via cronjob by passing a testResultId into the testWorker instances
 * next method. The worker will load the testResult and check what to do next in order to finish the task.
 *
 * Takes care of starting the right webPagetests at the right time
 *
 * @return {TestWorker}
 */
class TestWorker {
  constructor(db, comparisonWorker) {
    this.db = db
    this.comparisonWorker = comparisonWorker
    this.testResultHandler = new WebPagetestResultHandler(db)
  }

  /* public */
  next(testResultId) {
    this.db.log.info("testWorker next", testResultId)
    this.db.TestResult.load(testResultId, { refresh: true })
      .then(testResult => testResult.ready().then(() => {
        if (testResult.hasFinished) {
          this.db.log.info(`TestResult is finished`, { testResult })
          this.comparisonWorker && this.comparisonWorker.handleTestResult(testResult.id)
        }
        if (this.hasNotFinishedWebPagetests(testResult)) {
          this.db.log.info(`checkWebPagetestStatus`, { testResult })
          this.checkWebPagetestsStatus(testResult)
        } else {
          if (testResult.isClone) {
            if (this.shouldStartPreparationTests(testResult)) {
              !testResult.speedKitConfig && this.startConfigGenerationTest(testResult)
              this.startPrewarmWebPagetest(testResult)
            } else if (this.shouldStartPerformanceTests(testResult)) {
              this.db.log.info(`startPerformanceTest`, { testResult })
              this.startPerformanceWebPagetest(testResult)
            }
          } else {
            if (this.shouldStartPerformanceTests(testResult)) {
              this.startPerformanceWebPagetest(testResult)
            }
          }
        }
      }))
      .catch(error => this.db.log.warn(`Error while next iteration`, {id: testResultId, error: error.stack}))
  }

  handleWebPagetestResult(testId) {
    return this.testResultHandler.handleResult(testId)
      .then(testResult => {
        this.db.log.info("handleTestResult next", { testId })
        this.next(testResult.id)
        return testResult
      })
      .catch(error => this.db.log.error(`Error while handling WPT result`, {testId, error: error.stack}))
  }

  /* private */
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
    const checks = testResult.webPagetests.filter(wpt => !wpt.hasFinished).map(wpt => this.getStatusFromAPI(wpt.testId))
    Promise.all(checks).then(() => this.next(testResult.id));
  }

  getStatusFromAPI(testId) {
    return API.getTestStatus(testId).then(test => {
      if (test.statusCode === 200) {
        return Promise.resolve(
          this.testResultHandler.handleResult(testId)
            .catch(error => this.db.log.warn(`Could not find testResult`, {id: testResultId, error: error.stack}))
        )
      }
      return Promise.reject(false)
    })
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
    }).catch(error => this.db.log(`Error while starting WPT test`,{ testResult: testResult.id, error:error.stack }))
  }

  startConfigGenerationTest(testResult) {
    const { testInfo } = testResult
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
    }).catch(error => this.db.log(`Error while starting WPT test`,{ testResult: testResult.id, error:error.stack }))
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
    }).catch(error => this.db.log(`Error while starting WPT test`,{ testResult: testResult.id, error:error.stack }))
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
