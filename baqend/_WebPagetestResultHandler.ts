import { baqend, model } from 'baqend'
import { generateTestResult, ViewportError } from './_resultGeneration'
import { setFailed, setSuccess } from './_Status'

export enum TestType {
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
    // Handle the result by type
    return await this.updateTestWithResult(test, webPagetest)
  }

  /**
   * Handles the failure of a given WPT test ID.
   *
   * @param test The abstract test model.
   * @param webPagetest The actual WebPagetest run.
   * @return The updated test result.
   */
  async handleFailure(test: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    // Handle the failure by type
    return this.updateTestWithFailure(test, webPagetest)
  }

  /**
   * Updates the test after a WebPagetest test is finished.
   */
  private async updateTestWithResult(test: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    const wptTestId = webPagetest.testId

    switch (webPagetest.testType) {
      case TestType.PERFORMANCE: {
        this.db.log.info(`[WPRH.handleResult] Performance Test successful: ${wptTestId}`, {
          testResult: test.id,
          wptTestId,
        })

        try {
          await generateTestResult(wptTestId, test, this.db)

          return await test.optimisticSave(() => {
            setSuccess(webPagetest);
            setSuccess(test);
          })

        } catch(error) {
          this.db.log.error(`Generating test result failed: ${error.message}`, { test: test.id, wptTestId, error: error.stack })
          if (error instanceof ViewportError) {
            return this.handleViewportError(test, webPagetest)
          }

          if (!test.speedKitConfig.includes('SCRAPING')) {
            this.db.log.info(`Retry test with scraping`, { test: test.id, wptTestId, error: error.stack })
            return this.retryTestWithScraping(test, webPagetest)
          }

          // Now the test is finished without data
          return test.optimisticSave(() => {
            setFailed(webPagetest);
            setFailed(test);
          })
        }
      }

      case TestType.PREWARM: {
        return test.optimisticSave(() => setSuccess(webPagetest))
      }

      default: {
        throw new Error(`Unexpected test type: ${webPagetest.testType}.`)
      }
    }
  }

  /**
   * Removes the WPT test entry from the test result if there was a viewport error.
   */
  private handleViewportError(test: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    const retries = test.retries || 0
    return test.optimisticSave(() => {
      const wptIndex = test.webPagetests.findIndex(wptTest => wptTest.testId === webPagetest.testId)
      test.webPagetests.splice(wptIndex, 1)
      test.retries = retries + 1
    })
  }

  /**
   * Removes the WPT test entry from the test result and retries it with scraping variation.
   */
  private retryTestWithScraping(test: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    const retries = test.retries || 0
    return test.optimisticSave(() => {
      test.speedKitConfig = test.speedKitConfig.replace('{', '{ customVariation: [{\n' +
        '    rules: [{ contentType: ["navigate", "fetch"] }],\n' +
        '    variationFunction: () => "SCRAPING"\n' +
        '  }],')

      const wptIndex = test.webPagetests.findIndex(wptTest => wptTest.testId === webPagetest.testId)
      test.webPagetests.splice(wptIndex, 1)
      test.retries = retries + 1
    })
  }

  /**
   * Updates the test after a WebPagetest test is finished.
   */
  private updateTestWithFailure(test: model.TestResult, webPagetest: model.WebPagetest): Promise<model.TestResult> {
    const wptTestId = webPagetest.testId

    switch (webPagetest.testType) {
      case TestType.PERFORMANCE: {
        this.db.log.info(`[WPRH.handleResult] Performance Test failed: ${wptTestId}`, {
          testResult: test.id,
          wptTestId,
        })

        return test.optimisticSave(() => {
          test.testDataMissing = true
          setFailed(webPagetest);
          setFailed(test);
        })
      }

      case TestType.PREWARM: {
        return test.optimisticSave(() => setFailed(webPagetest))
      }

      default: {
        throw new Error(`Unexpected test type: ${webPagetest.testType}.`)
      }
    }
  }
}
