import { baqend, model } from 'baqend'
import { generateTestResult } from './_resultGeneration'

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
    // Mark WebPagetest run as successfully finished
    await test.ready()
    webPagetest.status = 'SUCCESS'
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
      case TestType.PERFORMANCE: {
        this.db.log.info(`[WPRH.handleResult] Performance Test successful: ${wptTestId}`, {
          testResult: test.id,
          wptTestId,
        })

        return generateTestResult(wptTestId, test, this.db).then(() => {
          return test.optimisticSave((it: model.TestResult) => {
            it.status = 'SUCCESS'
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
}
