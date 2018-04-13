import { baqend, model } from 'baqend'
import { ConfigGenerator } from './_ConfigGenerator'
import { Pagetest, WptTestResultOptions } from './_Pagetest'
import { generateTestResult } from './_resultGeneration'
import { ConfigCache } from './_ConfigCache'
import { DataType } from './_Serializer'

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
  constructor(
    private readonly db: baqend,
    private readonly api: Pagetest,
    private readonly configGenerator: ConfigGenerator,
    private readonly configCache: ConfigCache,
  ) {
  }

  /**
   * Handles the result of a given WPT test ID.
   *
   * @param test The abstract test model.
   * @param webPagetest The actual WebPagetest run.
   * @return The updated test result.
   */
  async handleResult(test: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    const wptTestId = webPagetest.testId
    this.db.log.info(`[WPRH.handleResult] For ${wptTestId}`)

    // Mark WebPagetest run as finished
    await test.ready()
    webPagetest.hasFinished = true
    await test.save()

    // Handle the result by type
    return this.updateTestWithResult(test, webPagetest)
  }

  /**
   * Updates the test after a WebPagetest test is finished.
   */
  private updateTestWithResult(test: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    const wptTestId = webPagetest.testId

    switch (webPagetest.testType) {
      case TestType.CONFIG: {
        return this.getSmartConfig(wptTestId, test.testInfo.url, test.testInfo.testOptions.mobile).then((config) => {
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
        return Promise.resolve(test)
      }

      default: {
        throw new Error(`Unexpected test type: ${webPagetest.testType}.`)
      }
    }
  }

  /**
   * Get the smart config based on the domains of a given testId.
   *
   * @param testId    The id of the test to get the domains from.
   * @param url       The URL the test was performed against.
   * @param mobile
   * @param type      The data type of the config to generate.
   * @return          The generated config as serialized string.
   */
  async getSmartConfig(testId: string, url: string, mobile: boolean, type: DataType = DataType.JAVASCRIPT): Promise<string> {
    const options: WptTestResultOptions = {
      requests: true,
      breakdown: false,
      domains: true,
      pageSpeed: false,
    }

    try {
      const result = await this.api.getTestResults(testId, options)
      const domains = result.data
      this.db.log.info('Generating Smart Config', { url, mobile })
      const config = await this.configGenerator.generateSmart(url, domains, mobile, type)
      // Save cached config
      return await this.configCache.put(url, mobile, config)
    } catch (error) {
      this.db.log.warn('Smart generation failed', { url, mobile, error: error.stack })

      return this.configGenerator.generateFallback(url)
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
