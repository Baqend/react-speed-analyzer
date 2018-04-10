import { baqend, model } from 'baqend'
import { API, WptTestResultOptions } from './Pagetest'
import { generateTestResult } from './resultGeneration'
import { cacheSpeedKitConfig } from './configCaching'
import { createSmartConfig, getFallbackConfig } from './configGeneration'

export enum TestType {
  CONFIG = 'config',
  PERFORMANCE = 'performance',
  PREWARM = 'prewarm',
}

/**
 * Handles a webpage test result to continue a single comparison test.
 * Instance in TestWorker
 * @return {WebPagetestResultHandler}
 */
export class WebPagetestResultHandler {
  constructor(private db: baqend) {
  }

  /**
   * Handles the result of a given WPT test ID.
   *
   * @param wptTestId The ID of the WebPagetest test to be handled.
   * @return The updated test result.
   */
  async handleResult(wptTestId: string): Promise<model.TestResult> {
    this.db.log.info(`[WPRH.handleResult] For ${wptTestId}`)
    let testResult = await this.db.TestResult.find().equal('webPagetests.testId', wptTestId).singleResult()
    if (!testResult) {
      this.db.log.warn('[WPRH.handleResult] There was no testResult found for testId', { wptTestId })
      throw new Error(`No testResult found in cache ${wptTestId}`)
    }

    const webPageTestInfo = this.getWebPagetestInfo(testResult, wptTestId)
    if (!webPageTestInfo) {
      this.db.log.warn('[WPRH.handleResult] Unable to verify test type', { testResult })
      throw new Error(`No WPT info with id ${wptTestId} found for testResult ${testResult.id}`)
    }

    if (webPageTestInfo.hasFinished) {
      this.db.log.warn('[WPRH.handleResult] wptInfo object was already finished', { testResult })
      throw new Error(`WPT ${wptTestId} for testResult ${testResult.id} was already finished`)
    }

    await this.updateTestWithResult(testResult, webPageTestInfo)
    return testResult.optimisticSave(() => {
      webPageTestInfo.hasFinished = true
    })
  }

  /**
   * Updates the test after a WebPagetest test is finished.
   */
  private updateTestWithResult(test: model.TestResult, wptInfo: model.WebPagetest): Promise<any> {
    const wptTestId = wptInfo.testId

    switch (wptInfo.testType) {
      case TestType.CONFIG: {
        return this.getSmartConfig(wptTestId, test.testInfo).then((config) => {
          return test.optimisticSave((it: model.TestResult) => {
            it.speedKitConfig = config
          })
        })
      }

      case TestType.PERFORMANCE: {
        this.db.log.info(`[WPRH.handleResult] Performance Test successful: ${wptTestId}`, { testResult: test.id, wptTestId })

        return generateTestResult(wptTestId, test, this.db).then(() => {
          return test.optimisticSave((it: model.TestResult) => {
            it.hasFinished = true
          })
        })
      }

      case TestType.PREWARM: {
        /* Do nothing */
        return Promise.resolve()
      }

      default: {
        throw new Error(`Unexpected test type: ${wptInfo.testType}.`)
      }
    }
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
   * Get the corresponding WPT info object (id, type and status) of a given wptTestId.
   *
   * @param test The result in which the info is to be found.
   * @param wptTestId The WebPagetest test ID to get the WPT info for.
   * @return The WPT info object.
   */
  private getWebPagetestInfo(test: model.TestResult, wptTestId: string): model.WebPagetest | undefined {
    return test.webPagetests.find(wpt => wpt.testId === wptTestId)
  }
}
