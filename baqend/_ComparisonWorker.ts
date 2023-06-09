import { baqend, model } from 'baqend'
import { ComparisonFactory } from './_ComparisonFactory'
import { cancelTest, createFilmStrip, parallelize } from './_helpers'
import { Pagetest } from './_Pagetest'
import {
  isFailed,
  isFinished,
  isIncomplete,
  isUnfinished,
  setCanceled, setFailed,
  setIncomplete,
  setRunning,
  setSuccess,
  Status,
} from './_Status'
import { factorize } from './_updateMultiComparison'
import { chooseFMP } from './_chooseFMP'
import { TestListener, TestWorker } from './_TestWorker'

export interface ComparisonListener {
  handleComparisonFinished(comparison: model.TestOverview): any
}

/**
 * The ComparisonWorker takes care of finishing a comparison. It can be either called manually
 * or via cronjob by passing a testOverviewId into its next method.
 * The worker will load the testOverview and check what to do next in order to finish the task.
 * The next method is called by the TestWorker, when a testResult is finished
 *
 * @return {TestWorker}
 */
export class ComparisonWorker implements TestListener {
  constructor(
    private readonly db: baqend,
    private readonly api: Pagetest,
    private testWorker: TestWorker,
    private comparisonFactory: ComparisonFactory,
    private listener?: ComparisonListener,
  ) {
    this.testWorker.setListener(this)
  }

  setListener(value: ComparisonListener) {
    this.listener = value
  }

  async next(comparison: model.TestOverview) {
    this.db.log.debug(`ComparisonWorker.next("${comparison.key}")`)

    // Ensure comparison is loaded with depth 1
    await comparison.load({ depth: 1, refresh: true })

    // Is this comparison already finished
    if (isFinished(comparison)) {
      return
    }

    const started = Math.ceil((Date.now() - comparison.updatedAt.getTime()) / 1000)
    if (started > 300) {
      const message = `Comparison was still not finished after ${started} seconds.`
      await this.comparisonFactory.updateComparisonWithError(comparison, this.api, { message, status: 599 })
      return
    }

    // Set comparison to running
    if (comparison.status !== Status.RUNNING) {
      try {
        await comparison.optimisticSave(() => setRunning(comparison))
      } catch(e) {
        this.db.log.info(`Retry status update after out of date exception for comparison ${comparison.id}`)
        await comparison.load({ depth: 1, refresh: true })
        await comparison.optimisticSave(() => setRunning(comparison))
      }
    }

    const { url, mobile, competitorTestResult: competitor, speedKitTestResult: speedKit } = comparison

    // Is TestOverview finished?
    if (isFinished(competitor) && isFinished(speedKit)) {
      this.db.log.info(`Comparison ${comparison.key} is finished.`, { comparison })
      if (isFinished(comparison)) {
        this.db.log.warn(`Comparison ${comparison.key} was already finished.`, { comparison })
        return
      }

      await chooseFMP(competitor, speedKit)
      const skTestId = speedKit.webPagetests[speedKit.webPagetests.length - 1].testId
      const compTestId = competitor.webPagetests[competitor.webPagetests.length - 1].testId
      const wptFilmstrip = await createFilmStrip(this.db, [compTestId, skTestId], url, !mobile);

      await comparison.optimisticSave(() => {
        const failed = isFailed(competitor) && isFailed(speedKit)
        const incomplete = isIncomplete(competitor) || isIncomplete(speedKit)
        failed ? setFailed(comparison) : (incomplete ? setIncomplete(comparison) : setSuccess(comparison))

        comparison.wptFilmstrip = wptFilmstrip
        comparison.factors = this.calculateFactors(competitor, speedKit)
        comparison.documentRequestFailed = speedKit.firstView ? speedKit.firstView.documentRequestFailed : false
      })

      // Inform the listener that this comparison has finished
      this.listener && this.listener.handleComparisonFinished(comparison)

      return
    }

    // Start competitor right away
    if (!competitor.hasFinished) {
      this.testWorker.next(competitor).catch((err) => this.db.log.error(err.message, err))
    }
    // Start speed kit run only if competitor finished because we need meta data of the competitor run
    if (competitor.hasFinished && !speedKit.hasFinished) {
      this.testWorker.next(speedKit).catch((err) => this.db.log.error(err.message, err))
    }
  }

  /**
   * Cancels the given comparison.
   */
  async cancel(comparison: model.TestOverview): Promise<boolean> {
    if (isFinished(comparison)) {
      return false
    }

    // Cancel all tests
    await [comparison.competitorTestResult, comparison.speedKitTestResult]
      .filter(test => isUnfinished(test))
      .map(test => cancelTest(test, this.api))
      .reduce(parallelize)

    // Mark comparison as cancelled
    await comparison.optimisticSave(() => setCanceled(comparison))

    return true
  }

  async handleTestFinished(test: model.TestResult): Promise<void> {
    try {
      const comparison = await this.findComparisonByTest(test)
      if (!comparison) throw new Error('Could not find comparison by test')

      if (!test.isClone) {
        await this.comparisonFactory.updateComparisonWithCompetitorData(comparison, test)
      }

      this.db.log.info(`Test finished: ${test.id}`)
      this.next(comparison).catch((err) => this.db.log.error(err.message, err))
    } catch (error) {
      this.db.log.error('Error while handling test result', { id: test.id, error: error.stack })
    }
  }

  private calculateFactors(compResult: model.TestResult, skResult: model.TestResult) {
    if (skResult.testDataMissing || compResult.testDataMissing || !compResult.firstView || !skResult.firstView) {
      return null
    }

    try {
      return factorize(this.db, compResult.firstView, skResult.firstView)
    } catch (e) {
      this.db.log.warn(`Could not calculate factors for overview with competitor ${compResult.id}`)
      return null
    }
  }

  private async findComparisonByTest(test: model.TestResult): Promise<model.TestOverview | null> {
    const testId = test.id
    const comparison = await this.db.TestOverview.find()
      .where({
        '$or': [
          { 'competitorTestResult': { '$eq': testId } },
          { 'speedKitTestResult': { '$eq': testId } },
        ],
      }).singleResult({ depth: 1 })

    this.db.log.info('Comparison found to handle test result', comparison)
    return comparison
  }
}
