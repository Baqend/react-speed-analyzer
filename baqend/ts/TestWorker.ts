import { baqend, model } from 'baqend'
import { API } from './Pagetest'
import { WebPagetestResultHandler } from './WebPagetestResultHandler'
import { getFallbackConfig, getMinimalConfig } from './configGeneration'
import { createTestScript, SpeedKitConfigArgument } from './createTestScript'
import credentials from './credentials'

const PING_BACK_URL = `https://${credentials.app}.app.baqend.com/v1/code/testResultPingback`;

const prewarmOptions = {
  runs: 2,
  timeline: false,
  video: false,
  firstViewOnly: true,
  minimalResults: true
}

export interface TestListener {
  handleTestFinished(test: model.TestResult): any
}

export interface TestParams {
  url: string
  isTestWithSpeedKit: boolean
  isSpeedKitComparison: boolean
  activityTimeout: number
  testOptions: {
    mobile: boolean
  }
}

/**
 * The TestWorker takes care of finishing the tests that are running for a comparison. It can
 * be either called manually or via cronjob by passing a testResultId into the testWorker instances
 * next method. The worker will load the testResult and check what to do next in order to finish the task.
 *
 * Takes care of starting the right webPagetests at the right time
 */
export class TestWorker {
  private testResultHandler: WebPagetestResultHandler

  constructor(private db: baqend, private listener?: TestListener) {
    this.db = db
    this.listener = listener
    this.testResultHandler = new WebPagetestResultHandler(db)
  }

  setListener(value: TestListener) {
    this.listener = value
  }

  /* public */
  async next(testResultId: string) {
    this.db.log.info(`TestWorker.next("${testResultId}")`)
    try {
      const test = await this.db.TestResult.load(testResultId, { refresh: true })

      // Is the test finished?
      if (test.hasFinished) {
        this.db.log.info(`Test ${test.key} is finished.`, { test })
        this.listener && this.listener.handleTestFinished(test)

        return
      }

      await test.ready()
      if (this.hasNotFinishedWebPagetests(test)) {
        this.db.log.info(`checkWebPagetestStatus`, { test })
        this.checkWebPagetestsStatus(test)

        return
      }

      if (test.isClone) {
        if (this.shouldStartPreparationTests(test)) {
          !test.speedKitConfig && this.startConfigGenerationTest(test)
          this.startPrewarmWebPagetest(test)
        } else if (this.shouldStartPerformanceTests(test)) {
          this.db.log.info(`startPerformanceTest`, { test })
          this.startPerformanceWebPagetest(test)
        }
      } else {
        if (this.shouldStartPerformanceTests(test)) {
          this.startPerformanceWebPagetest(test)
        }
      }
    } catch(error) {
      this.db.log.warn(`Error while next iteration`, {id: testResultId, error: error.stack})
    }
  }

  async handleWebPagetestResult(testId: string): Promise<void> {
    try {
      const testResult = await this.testResultHandler.handleResult(testId)
      this.db.log.info('handleTestResult next', { testId })
      this.next(testResult.id).catch((err) => this.db.log.error(err.message, err))
    } catch (error) {
      this.db.log.error('Error while handling WPT result', { testId, error: error.stack })
    }
  }

  private shouldStartPreparationTests(testResult: model.TestResult) {
    if (testResult.testInfo.skipPrewarm) {
      return false
    }
    return !testResult.webPagetests || !testResult.webPagetests.length
  }

  private shouldStartPerformanceTests(testResult: model.TestResult) {
    return testResult.webPagetests.map(wpt => wpt.testType).indexOf('performance') === -1
  }

  private hasNotFinishedWebPagetests(testResult: model.TestResult) {
    return testResult.webPagetests.filter(wpt => !wpt.hasFinished).length > 0
  }

  private checkWebPagetestsStatus(testResult: model.TestResult) {
    this.db.log.info("checkWebPagetestsStatus next", { testResult })
    const checks = testResult.webPagetests.filter(wpt => !wpt.hasFinished).map(wpt => this.getStatusFromAPI(wpt.testId))
    Promise.all(checks).then(() => this.next(testResult.id));
  }

  private getStatusFromAPI(testId: string) {
    return API.getTestStatus(testId).then(test => {
      if (test.statusCode === 200) {
        return Promise.resolve(
          this.testResultHandler.handleResult(testId)
            .catch(error => this.db.log.warn(`Could not find testResult`, {id: testId, error: error.stack}))
        )
      }
      return Promise.reject(false)
    })
  }

  private startPrewarmWebPagetest(testResult: model.TestResult) {
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
    }).catch(error => this.db.log.error(`Error while starting WPT test`,{ testResult: testResult.id, error:error.stack }))
  }

  private startConfigGenerationTest(testResult: model.TestResult) {
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
    }).catch(error => this.db.log.error(`Error while starting WPT test`,{ testResult: testResult.id, error:error.stack }))
  }

  private startPerformanceWebPagetest(testResult: model.TestResult): Promise<model.TestResult> {
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
    }).catch(error => this.db.log.error(`Error while starting WPT test`,{ testResult: testResult.id, error:error.stack }))
  }

  private pushWebPagetestToTestResult(testResult: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    testResult.webPagetests.push(webPagetest)

    return testResult.ready().then(() => testResult.save())
  }

  private getScriptForConfig(config: SpeedKitConfigArgument, { url, isSpeedKitComparison, isTestWithSpeedKit, activityTimeout, testOptions }: TestParams) {
    config = config || getFallbackConfig(this.db, url, testOptions.mobile)

    return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout)
  }

  private getTestScriptWithMinimalWhitelist({ url, isTestWithSpeedKit, isSpeedKitComparison, activityTimeout, testOptions }: TestParams) {
    const config = getMinimalConfig(this.db, url, testOptions.mobile);

    return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout);
  }
}
