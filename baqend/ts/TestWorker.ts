import { baqend, model } from 'baqend'
import { API } from './Pagetest'
import { TestType, WebPagetestResultHandler } from './WebPagetestResultHandler'
import { getFallbackConfig, getMinimalConfig } from './configGeneration'
import { createTestScript, SpeedKitConfigArgument } from './createTestScript'
import credentials from './credentials'
import { sleep } from './sleep'

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

  constructor(private readonly db: baqend, private listener?: TestListener) {
    this.db = db
    this.listener = listener
    this.testResultHandler = new WebPagetestResultHandler(db)
  }

  setListener(value: TestListener) {
    this.listener = value
  }

  async next(test: model.TestResult): Promise<void> {
    this.db.log.info(`TestWorker.next("${test.key}")`)
    try {
      // Ensure test is loaded
      await test.load()

      // Is the test finished?
      if (test.hasFinished) {
        this.db.log.info(`Test ${test.key} is finished.`, { test })
        this.listener && this.listener.handleTestFinished(test)

        return
      }

      // Is WebPagetest still running this test? Check the status and start over.
      if (this.hasNotFinishedWebPagetests(test)) {
        this.checkWebPagetestsStatus(test)
          .catch((err) => this.db.log.error(`TestWorker.checkWebPagetestsStatus failed: ${err.message}`, err))

        return
      }

      // Start the next test
      if /* test is against Speed Kit */ (test.isClone) {
        if (this.shouldStartPrewarmWebPagetest(test)) {
          if (!test.speedKitConfig) {
            this.startConfigWebPagetest(test)
          }

          this.startPrewarmWebPagetest(test)

          return
        }
      }

      if (this.shouldStartPerformanceWebPagetest(test)) {
        this.startPerformanceWebPagetest(test)
      }
    } catch (error) {
      this.db.log.warn(`Error while next iteration`, {id: test.id, error: error.stack})
    }
  }

  /**
   * Handles the result of test from WebPagetest.
   */
  async handleWebPagetestResult(testId: string): Promise<void> {
    try {
      const test = await this.testResultHandler.handleResult(testId)
      this.db.log.info('handleTestResult next', { testId })
      this.next(test).catch((err) => this.db.log.error(err.message, err))
    } catch (error) {
      this.db.log.error('Error while handling WPT result', { testId, error: error.stack })
    }
  }

  /**
   * Determines whether a prewarm test against WebPagetest should be started.
   */
  private shouldStartPrewarmWebPagetest(test: model.TestResult): boolean {
    if (test.testInfo.skipPrewarm) {
      return false
    }
    return !test.webPagetests || !test.webPagetests.length
  }

  /**
   * Determines whether a performance test against WebPagetest should be started.
   */
  private shouldStartPerformanceWebPagetest(test: model.TestResult): boolean {
    return test.webPagetests.map(wpt => wpt.testType).indexOf('performance') === -1
  }

  /**
   * Checks whether all WebPagetest tests have been finished or not.
   */
  private hasNotFinishedWebPagetests(test: model.TestResult): boolean {
    return test.webPagetests.filter(wpt => !wpt.hasFinished).length > 0
  }

  /**
   * Is executed when WebPagetest tests are currently running.
   */
  private async checkWebPagetestsStatus(test: model.TestResult): Promise<void> {
    this.db.log.info(`TestWorker.checkWebPagetestsStatus("${test.key}")`, { test })
    const checks = test.webPagetests
      .filter(wpt => !wpt.hasFinished)
      .map(async wpt => {
        const wptTestId = wpt.testId
        if (await this.isWebPagetestFinished(wptTestId)) {
          try {
            await this.handleWebPagetestResult(wptTestId)
          } catch (err) {
            this.db.log.warn(`Could not find status of test ${wptTestId}`, err)
          }

          return true
        }

        return false
      })

    const results = await Promise.all(checks)
    const areAllWebPagetestsFinished = results.reduce((prev, it) => prev && it, true)
    if (areAllWebPagetestsFinished) {
      return
    }

    this.db.log.info(`TestWorker.checkWebPagetestsStatus("${test.key}"): WPT not finished! Sleep …`, { test })
    // We are not finished: check again after sleep
    await sleep(1000)

    return this.checkWebPagetestsStatus(test)
  }

  /**
   * Checks that the status from the API is 200.
   *
   * @param {string} wptTestId The WebPagetest test's ID.
   * @return {Promise<void>}
   */
  private async isWebPagetestFinished(wptTestId: string): Promise<boolean> {
    const test = await API.getTestStatus(wptTestId)

    return test.statusCode === 200
  }

  /**
   * Starts a prewarm against WebPagetest.
   */
  private startPrewarmWebPagetest(test: model.TestResult): Promise<void> {
    const { speedKitConfig, testInfo } = test
    const { testOptions } = testInfo
    const prewarmTestScript = this.getScriptForConfig(speedKitConfig, testInfo);
    const prewarmTestOptions = Object.assign({ pingback: PING_BACK_URL }, testOptions, prewarmOptions);

    return this.startWebPagetest(test, TestType.PREWARM, prewarmTestScript, prewarmTestOptions)
  }

  /**
   * Starts a config test against WebPagetest.
   */
  private startConfigWebPagetest(test: model.TestResult): Promise<void> {
    const { testInfo } = test
    const { testOptions } = testInfo;
    const configTestScript = this.getTestScriptWithMinimalWhitelist(testInfo);
    const configTestOptions = Object.assign({ pingback: PING_BACK_URL }, testOptions, prewarmOptions, { runs: 1 });

    return this.startWebPagetest(test, TestType.CONFIG, configTestScript, configTestOptions)
  }

  /**
   * Starts a performance test against WebPagetest.
   */
  private startPerformanceWebPagetest(test: model.TestResult): Promise<void> {
    const { speedKitConfig, testInfo } = test
    const { testOptions } = testInfo
    const performanceTestScript = this.getScriptForConfig(speedKitConfig, testInfo)
    const performanceTestOptions = Object.assign({ pingback: PING_BACK_URL }, testOptions)

    return this.startWebPagetest(test, TestType.PERFORMANCE, performanceTestScript, performanceTestOptions)
  }

  /**
   * Starts a test against WebPagetest.
   */
  private async startWebPagetest(test: model.TestResult, testType: TestType, testScript: string, testOptions: any): Promise<void> {
    try {
      const testId = await API.runTestWithoutWait(testScript, testOptions)
      await this.pushWebPagetestToTestResult(test, new this.db.WebPagetest({
        testId,
        testType,
        testScript,
        testOptions,
        hasFinished: false
      }))
    } catch (error) {
      this.db.log.error(`Error while starting ${testType} WPT test`, { test, error })
    }
  }

  /**
   * Saves a WebPagetest info in a test.
   */
  private pushWebPagetestToTestResult(test: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    return test.optimisticSave((it: model.TestResult) => {
      it.webPagetests.push(webPagetest)
    })
  }

  private getScriptForConfig(config: SpeedKitConfigArgument, { url, isSpeedKitComparison, isTestWithSpeedKit, activityTimeout, testOptions }: TestParams): string {
    const c = config || getFallbackConfig(this.db, url, testOptions.mobile)

    return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, c, activityTimeout)
  }

  private getTestScriptWithMinimalWhitelist({ url, isTestWithSpeedKit, isSpeedKitComparison, activityTimeout, testOptions }: TestParams): string {
    const config = getMinimalConfig(this.db, url, testOptions.mobile);

    return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout);
  }
}
