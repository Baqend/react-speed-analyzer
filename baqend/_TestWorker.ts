import { baqend, model } from 'baqend'
import { ConfigGenerator } from './_ConfigGenerator'
import { cancelTest, getVariation } from './_helpers'
import { DataType, Serializer } from './_Serializer'
import { isCanceled, isFinished, isIncomplete, setFailed, setRunning, Status } from './_Status'
import { DEFAULT_TIMEOUT } from './_TestBuilder'
import { TestError } from './_TestFactory'
import { TestScriptBuilder } from './_TestScriptBuilder'
import { Pagetest } from './_Pagetest'
import { TestType, WebPagetestResultHandler } from './_WebPagetestResultHandler'
import credentials from './credentials'

const ONE_MINUTE = 1000 * 60
const ONE_HOUR = ONE_MINUTE * 60

const PING_BACK_URL = `https://${credentials.app}.app.baqend.com/v1/code/testResultPingback`

const prewarmOptions = {
  runs: 2,
  timeline: false,
  video: false,
  fvonly: true,
  minimalResults: true,
}

export interface TestListener {
  handleTestFinished(test: model.TestResult): any
}

/**
 * The TestWorker takes care of finishing the tests that are running for a comparison. It can
 * be either called manually or via cronjob by passing a testResultId into the testWorker instances
 * next method. The worker will load the testResult and check what to do next in order to finish the task.
 *
 * Takes care of starting the right webPagetests at the right time
 */
export class TestWorker {
  constructor(
    private readonly db: baqend,
    private readonly api: Pagetest,
    private readonly webPagetestResultHandler: WebPagetestResultHandler,
    private readonly configGenerator: ConfigGenerator,
    private readonly testScriptBuilder: TestScriptBuilder,
    private readonly serializer: Serializer,
    private listener?: TestListener,
  ) {
  }

  setListener(value: TestListener) {
    this.listener = value
  }

  async next(test: model.TestResult): Promise<void> {
    this.db.log.debug(`TestWorker.next("${test.key}")`)
    try {
      // Ensure test is loaded
      await test.load({ refresh: true })

      // Is the test finished, canceled?
      if (isFinished(test)) {
        this.db.log.info(`Test ${test.key} is finished.`, { test })
        this.listener && this.listener.handleTestFinished(test)

        return
      }

      // Set test to running
      if (test.status !== Status.RUNNING) {
        await test.optimisticSave(() => setRunning(test))
      }

      if (this.isPerformanceRunIncomplete(test)) {
        await test.optimisticSave(() => setFailed(test))
        return
      }

      // Check if the test was not updated within the last three minutes
      const isOlderThanThreeMinutes = (new Date().getTime() - test.updatedAt!.getTime()) / ONE_MINUTE > 3
      if (test.status === Status.RUNNING && isOlderThanThreeMinutes) {
        await cancelTest(test, this.api, TestError.WPT_TIMEOUT)
        return
      }

      // Is WebPagetest still running this test? Check the status and start over.
      const isOlderThanTwoMinutes = (new Date().getTime() - test.updatedAt!.getTime()) / ONE_MINUTE > 2
      if (isOlderThanTwoMinutes && this.hasNotFinishedWebPagetests(test)) {
        this.checkWebPagetestsStatus(test)
          .catch((err) => this.db.log.error(`TestWorker.checkWebPagetestsStatus failed: ${err.message}`, err))

        return
      }

      // Start the next test
      if /* test is against Speed Kit */ (test.isClone) {
        if (this.shouldStartPrewarmWebPagetest(test)) {
          this.db.log.info(`Should Start Prewarm Test ${test.id}`);
          this.startPrewarmWebPagetest(test)

          return
        }
      }

      if (this.shouldStartPerformanceWebPagetest(test)) {
        this.db.log.info(`Should Start Performance Test ${test.id}`);
        this.startPerformanceWebPagetest(test)
      }
    } catch (error) {
      this.db.log.warn(`Error while next iteration`, { id: test.id, error: error.stack })
    }
  }

  /**
   * Handles the result of a test from WebPagetest.
   */
  async handleWebPagetestResult(wptTestId: string): Promise<void> {
    try {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      const test = await this.db.TestResult.find()
        .greaterThan('createdAt', date)
        .equal('webPagetests.testId', wptTestId)
        .singleResult()

      if (!test) {
        this.db.log.warn('There was no testResult found for testId', { wptTestId })
        return
      }

      const webPagetest = this.getWebPagetestInfo(test, wptTestId)
      if (isFinished(webPagetest) && !isCanceled(webPagetest)) {
        this.db.log.info(`WebPagetest ${wptTestId} was already finished or canceled`, { test })
        return
      }

      // Ensure Speed Kit config is set in case a retry with scraping is needed
      if (test.isClone) {
        test.speedKitConfig = this.getConfigForTest(test);
      }

      const updatedTest = await this.webPagetestResultHandler.handleResult(test, webPagetest)
      this.next(updatedTest).catch((err) => this.db.log.error(err.message, err))
    } catch (error) {
      this.db.log.error(`Cannot handle WPT result: ${error.message}`, { wptTestId, error: error.stack })
    }
  }

  /**
   * Handles the failure of a test from WebPagetest.
   */
  async handleWebPagetestFailure(wptTestId: string, reason: string): Promise<void> {
    try {
      const test = await this.db.TestResult.find().equal('webPagetests.testId', wptTestId).singleResult()
      if (!test) {
        this.db.log.warn('There was no testResult found for testId', { wptTestId })
        return
      }

      const webPagetest = this.getWebPagetestInfo(test, wptTestId)
      if (isFinished(webPagetest)) {
        this.db.log.debug(`WebPagetest ${wptTestId} was already marked as failed`, { test })
        return
      }

      const updatedTest = await this.webPagetestResultHandler.handleFailure(test, webPagetest, reason)
      this.next(updatedTest).catch((err) => this.db.log.error(err.message, err))
    } catch (error) {
      this.db.log.error(`Cannot handle WPT result: ${error.message}`, { wptTestId, error: error.stack })
    }
  }

  /**
   * Checks whether the performance run of a given test is incomplete.
   */
  private isPerformanceRunIncomplete(test: model.TestResult): boolean {
    if (test.webPagetests.length === 0) {
      return false
    }

    const performanceRun = test.webPagetests.find((test) => test.testType === TestType.PERFORMANCE)

    return performanceRun ? isIncomplete(performanceRun) : false
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
    return test.webPagetests.filter(wpt => !isFinished(wpt)).length > 0
  }

  /**
   * Is executed when WebPagetest tests are currently running.
   */
  private async checkWebPagetestsStatus(test: model.TestResult): Promise<void> {
    this.db.log.debug(`TestWorker.checkWebPagetestsStatus("${test.key}")`, { test })
    test.webPagetests
      .filter(wpt => !isFinished(wpt))
      .map(async wpt => {
        const wptTestId = wpt.testId

        try {
          const test = await this.api.getTestStatus(wptTestId)

          // status code 200 means the test has finished
          if (test.statusCode === 200) {
            await this.handleWebPagetestResult(wptTestId)
            return true
            // status code >= 400 means there was an error
          } else if (test.statusCode >= 400) {
            await this.handleWebPagetestFailure(wptTestId, test.statusText)
            return true
          }

          return false
        } catch (err) {
          this.db.log.warn(`Could not find status of test ${wptTestId}`, err)
          return false
        }
      })
  }

  /**
   * Starts a prewarm against WebPagetest.
   */
  private startPrewarmWebPagetest(test: model.TestResult): Promise<void> {
    const { testInfo: { testOptions } } = test
    const prewarmTestScript = this.buildScriptForTestWithConfig(test)
    const prewarmTestOptions = Object.assign({ pingback: PING_BACK_URL }, testOptions, prewarmOptions)

    return this.startWebPagetest(test, TestType.PREWARM, prewarmTestScript, prewarmTestOptions)
  }

  /**
   * Starts a performance test against WebPagetest.
   */
  private startPerformanceWebPagetest(test: model.TestResult): Promise<void> {
    const { testInfo: { testOptions } } = test
    const performanceTestScript = this.buildScriptForTestWithConfig(test)
    const performanceTestOptions = Object.assign({ pingback: PING_BACK_URL }, testOptions)

    return this.startWebPagetest(test, TestType.PERFORMANCE, performanceTestScript, performanceTestOptions)
  }

  /**
   * Starts a test against WebPagetest.
   */
  private async startWebPagetest(test: model.TestResult, testType: TestType, testScript: string, testOptions: any): Promise<void> {
    try {
      const testId = await this.api.runTestWithoutWait(testScript, testOptions)
      await this.pushWebPagetestToTestResult(test, new this.db.WebPagetest({
        status: Status.RUNNING,
        hasFinished: false,
        testId,
        testType,
        testScript,
        testOptions,
      }))
    } catch (error) {
      this.db.log.error(`Could not start "${testType}" WebPagetest test: ${error.message}`, { test: test.id, error: error.stack })

      // do not retry prewarm tests and performance tests with more than 2 retries
      if (testType === TestType.PREWARM || (testType === TestType.PERFORMANCE && test.retries >= 2)) {
        this.db.log.error(`Change status of test "${test.id}" to FAILED because of reaching retry limit`)

        await this.pushWebPagetestToTestResult(test, new this.db.WebPagetest({
          status: Status.FAILED,
          hasFinished: true,
          testId: null,
          testType,
          testScript,
          testOptions,
        }))

        return
      }

      if (testType === TestType.PERFORMANCE) {
        const retries = test.retries || 0
        await test.optimisticSave(() => test.retries = retries + 1)
      }
    }
  }

  /**
   * Saves a WebPagetest info in a test.
   */
  private async pushWebPagetestToTestResult(test: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    this.db.log.info(`Push Webpagetest to ${test.id}`, webPagetest);
    return test.optimisticSave((it: model.TestResult) => {
      it.webPagetests.push(webPagetest)
    })
  }

  /**
   * Builds a test script for a test which has a config.
   */
  private buildScriptForTestWithConfig(test: model.TestResult): string {
    const { testInfo, location } = test
    const variation = getVariation(testInfo.testOptions.mobile, location)
    const { url, isTestWithSpeedKit, activityTimeout, appName, testOptions, cookie, navigateUrls, withScraping } = testInfo
    let config = isTestWithSpeedKit ? this.getConfigForTest(test).replace(/{/, '{ preloadBloomFilter: false,') : null
    if (config && withScraping) {
      config = config.replace('{', '{ customVariation: [{\n' +
      '    rules: [{ contentType: ["navigate", "fetch", "style", "image", "script"] }],\n' +
      '    variationFunction: () => "' + variation + '"\n' +
      '  }],')
    }

    return this.testScriptBuilder.createTestScript(
      url,
      isTestWithSpeedKit,
      config,
      location,
      testOptions.mobile,
      activityTimeout,
      appName,
      cookie,
      DEFAULT_TIMEOUT,
      navigateUrls,
    )
  }

  /**
   * Gets the config for a given test.
   * If the test has no config set, a fallback will be generated.
   */
  private getConfigForTest(test: model.TestResult): string {
    const { speedKitConfig, testInfo: { url, testOptions } } = test
    if (speedKitConfig) {
      return speedKitConfig
    }

    const fallback = this.configGenerator.generateFallback(url, testOptions.mobile)
    return this.serializer.serialize(fallback, DataType.JAVASCRIPT)
  }

  /**
   * Get the corresponding WPT info object (id, type and status) of a given wptTestId.
   *
   * @param test The result in which the info is to be found.
   * @param wptTestId The WebPagetest test ID to get the WPT info for.
   * @return The WPT info object.
   */
  private getWebPagetestInfo(test: model.TestResult, wptTestId: string): model.WebPagetest {
    const found = test.webPagetests.find(wpt => wpt.testId === wptTestId)
    if (!found) {
      throw new Error(`Test is missing WebPagetest run ${wptTestId}`)
    }

    return found
  }
}
