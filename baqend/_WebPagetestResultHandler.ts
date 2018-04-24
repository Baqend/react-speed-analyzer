import { baqend, model } from 'baqend'
import { Config } from './_Config'
import { ConfigGenerator } from './_ConfigGenerator'
import { Pagetest, WptTestResult, WptTestResultOptions } from './_Pagetest'
import { generateTestResult } from './_resultGeneration'
import { ConfigCache } from './_ConfigCache'
import { DataType, Serializer } from './_Serializer'

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
    private readonly serializer: Serializer,
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
            it.speedKitConfig = this.serializer.serialize(config, DataType.JAVASCRIPT)
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
   * @return          The generated config as serialized string.
   */
  async getSmartConfig(testId: string, url: string, mobile: boolean): Promise<Config> {
    const options: WptTestResultOptions = {
      requests: true,
      breakdown: false,
      domains: true,
      pageSpeed: false,
    }

    try {
      const result = await this.api.getTestResults(testId, options)
      this.db.log.info('Generating Smart Config', { url, mobile })
      const config = await this.configGenerator.generateSmart(url, this.getDomains(result.data), mobile)
      // Save cached config
      await this.configCache.put(url, mobile, config)

      return config
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

  private getDomains(testResult: WptTestResult): string[] {
    if (!testResult || !testResult.runs || !testResult.runs['1'] || !testResult.runs['1'].firstView || !testResult.runs['1'].firstView.domains) {
      throw new Error(`No testdata to analyze domains ${testResult.url}`)
    }

    const domains = Object.keys(testResult.runs['1'].firstView.domains)
    if (domains.length < 1) {
      this.db.log.warn(`Analyzed domains empty.`, { testResult })
      throw new Error(`No testdata to analyze domains ${testResult.url}`)
    }

    if (domains.length === 1) {
      this.db.log.warn(`Analyzed domains limited.`, { testResult })
      throw new Error(`Only one domain to analyse ${testResult.url}`)
    }

    return domains
  }
}
