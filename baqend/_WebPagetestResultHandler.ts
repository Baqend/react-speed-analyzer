import { baqend, model } from 'baqend'
import { getVariation } from './_helpers'
import { generateTestResult, ViewportError } from './_resultGeneration'
import { setFailed, setRunning, setSuccess } from './_Status'
import { TestError } from './_TestFactory'

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
   * @param failureText The message of the failure.
   * @return The updated test result.
   */
  async handleFailure(
    test: model.TestResult,
    webPagetest: model.WebPagetest,
    failureText: string,
  ): Promise<model.TestResult> {
    // Handle the failure by type
    return this.updateTestWithFailure(test, webPagetest, failureText)
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

          if (test.isClone && !!test.speedKitConfig && !test.testInfo.withScraping) {
            this.db.log.info(`Retry test with scraping`, { test: test.id, wptTestId, error: error.stack })
            return this.retryTestWithScraping(test, webPagetest)
          }

          const errorCause = !test.isClone ? TestError.ORIGIN_BLOCKED : (test.testInfo.withScraping ? TestError.SERVER_BLOCKED : error.message)
          // Now the test is finished without data
          return test.optimisticSave(() => {
            test.errorCause = errorCause
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
    const variation = getVariation(test.testInfo.testOptions.mobile, test.location)
    return test.optimisticSave(() => {
      test.speedKitConfig = test.speedKitConfig.replace('{', '{ customVariation: [{\n' +
        '    rules: [{ contentType: ["navigate", "fetch", "style", "image", "script"] }],\n' +
        '    variationFunction: () => "' + variation + '"\n' +
        '  }],')

      const wptIndex = test.webPagetests.findIndex(wptTest => wptTest.testId === webPagetest.testId)
      test.webPagetests.splice(wptIndex, 1)
      test.retries = retries + 1
      test.testInfo.withScraping = true
      setRunning(test)
    })
  }

  /**
   * Updates the test after a WebPagetest test is finished.
   */
  private updateTestWithFailure(
    test: model.TestResult,
    webPagetest: model.WebPagetest,
    failureText: string,
  ): Promise<model.TestResult> {
    const wptTestId = webPagetest.testId

    switch (webPagetest.testType) {
      case TestType.PERFORMANCE: {
        this.db.log.info(`[WPRH.handleResult] Performance Test failed: ${wptTestId}`, {
          testResult: test.id,
          wptTestId,
        })

        return test.optimisticSave(() => {
          test.testDataMissing = true
          test.errorCause = failureText
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
