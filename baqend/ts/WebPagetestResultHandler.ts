import { baqend, model } from 'baqend'
import { API, WptTestResultOptions } from './Pagetest'
import { generateTestResult } from './resultGeneration'
import { cacheSpeedKitConfig } from './configCaching'
import { createSmartConfig, getFallbackConfig } from './configGeneration'

const CONFIG_TYPE = 'config';
const PERFORMANCE_TYPE = 'performance';

/**
 * Handles a webpage test result to continue a single comparison test.
 * Instance in TestWorker
 * @return {WebPagetestResultHandler}
 */
export class WebPagetestResultHandler {
  constructor(private db: baqend) {
  }

  /**
   * Handles the result of a given WPT test id.
   *
   * @param {string} testId The id of the WPT test to be handled.
   * @return {TestResult} The updated test result.
   */
  async handleResult(testId: string): Promise<model.TestResult> {
    this.db.log.info(`[WPRH.handleResult] For ${testId}`)
    let testResult = await this.db.TestResult.find().equal('webPagetests.testId', testId).singleResult()
    if (!testResult) {
      this.db.log.warn('[WPRH.handleResult] There was no testResult found for testId', { testId })
      throw new Error(`No testResult found in cache ${testId}`)
    }

    const webPageTestInfo = this.getWebPagetestInfo(testResult, testId)
    if (!webPageTestInfo) {
      this.db.log.warn('[WPRH.handleResult] Unable to verify test type', { testResult })
      throw new Error(`No WPT info with id ${testId} found for testResult ${testResult.id}`)
    }

    let promise = Promise.resolve()
    if (webPageTestInfo.testType === CONFIG_TYPE) {
      promise = this.getSmartConfig(testId, testResult.testInfo).then((config) => {
        testResult.speedKitConfig = config
      })
    } else if (webPageTestInfo.testType === PERFORMANCE_TYPE) {
      this.db.log.info(`[WPRH.handleResult] Test successful: ${testId}`, { testResult: testResult.id, testId })
      promise = generateTestResult(testId, testResult, this.db).then((updatedResult) => {
        testResult = updatedResult
        testResult.hasFinished = true
      })
    }

    await promise
    webPageTestInfo.hasFinished = true
    await testResult.ready()

    return testResult.save()
  }

  /**
   * Get the smart config based on the domains of a given testId.
   *
   * @param testId    The id of the test to get the domains from.
   * @param testInfo  The info of the corresponding test.
   * @return          The generated config as string formatted json.
   */
  async getSmartConfig(testId: string, testInfo: any): Promise<string> {
    const options: WptTestResultOptions = {
      requests: true,
      breakdown: false,
      domains: true,
      pageSpeed: false,
    }

    try {
      const result = await API.getTestResults(testId, options)
      const domains = result.data
      this.db.log.info('Generating Smart Config', { url: testInfo.url })
      const config = await createSmartConfig(this.db, testInfo.url, domains, testInfo.isMobile)

      // Save cached config
      return await cacheSpeedKitConfig(this.db, testInfo.url, testInfo.testOptions.mobile, config)
    } catch (error) {
      this.db.log.warn('Smart generation failed', { url: testInfo.url, error: error.stack })

      return getFallbackConfig(this.db, testInfo.url)
    }
  }

  /**
   * Get the corresponding WPT info object (id, type and status) of a given testId.
   *
   * @param {TestResult} testResult The result in which the info is to be found.
   * @param {string} testId The id to get the WPT info for.
   * @return {object} The WPT info object.
   */
  private getWebPagetestInfo(testResult: model.TestResult, testId: string): model.WebPagetest | undefined {
    return testResult.webPagetests.find(wpt => wpt.testId === testId)
  }
}
