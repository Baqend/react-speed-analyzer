import { baqend, model } from 'baqend'
import { Config } from './_Config'
import { ConfigGenerator } from './_ConfigGenerator'
import { Pagetest, WptTestResult, WptTestResultOptions } from './_Pagetest'
import { generateTestResult } from './_resultGeneration'
import { ConfigCache } from './_ConfigCache'
import { DataType, Serializer } from './_Serializer'

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
}
