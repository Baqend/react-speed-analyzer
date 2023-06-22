import { baqend, model } from 'baqend'
import { ComparisonFactory } from './_ComparisonFactory'
import { ComparisonListener, ComparisonWorker } from './_ComparisonWorker'
import { createFilmStrip, parallelize } from './_helpers'
import {
  isFailed,
  isFinished,
  isIncomplete,
  isUnfinished,
  setCanceled, setFailed,
  setIncomplete,
  setPending,
  setRunning,
  setSuccess,
  Status,
} from './_Status'
import { updateMultiComparison } from './_updateMultiComparison'
import { resolveUrl } from './resolveUrl'

export const PANIC_MODE_MIN_FACTOR = 1.4
export const PANIC_MODE_RETRY_LIMIT = 10

const ONE_MINUTE = 1000 * 60

export interface MultiComparisonListener {
  handleMultiComparisonFinished(multiComparison: model.BulkTest): any
}

export class MultiComparisonWorker implements ComparisonListener {
  constructor(
    private db: baqend,
    private comparisonFactory: ComparisonFactory,
    private comparisonWorker: ComparisonWorker,
    private listener?: MultiComparisonListener) {
    this.comparisonWorker.setListener(this)
  }

  setListener(value: MultiComparisonListener) {
    this.listener = value
  }

  async next(multiComparison: model.BulkTest) {
    this.db.log.debug(`MultiComparisonWorker.next("${multiComparison.key}")`)
    try {
      // Ensure multi comparison is loaded with depth 1
      await multiComparison.load({ depth: 1, refresh: true })

      // Is this multi comparison already finished?
      if (isFinished(multiComparison)) {
        // Inform the listener that this multi comparison has finished
        this.listener && this.listener.handleMultiComparisonFinished(multiComparison)

        return
      }

      // Set multi comparison to running
      if (multiComparison.status !== Status.RUNNING) {
        await multiComparison.optimisticSave(() => setRunning(multiComparison))
      }

      const { testOverviews, runs } = multiComparison

      // Are all comparisons finished?
      const currentComparison = testOverviews[testOverviews.length - 1]
      if (currentComparison && isUnfinished(currentComparison)) {
        // Is WebPagetest still running this test? Check the status and start over.
        const isOlderThanFiveMinutes = (new Date().getTime() - multiComparison.updatedAt.getTime()) / ONE_MINUTE > 5
        if (isOlderThanFiveMinutes) {
          setPending(multiComparison)
        }
        return
      }

      // Are all planned comparisons finished?
      if (testOverviews.length >= runs) {
        await this.finalize(multiComparison)
        return
      }

      await this.startNextComparison(multiComparison, !!currentComparison)
    } catch (error) {
      this.db.log.warn(`Error while next iteration`, { id: multiComparison.id, error: error.stack })
    }
  }

  /**
   * Starts the next run of the multiComparison.
   */
  async startNextComparison(multiComparison: model.BulkTest, skipPrewarm: boolean): Promise<void> {
    // Make the prewarm only on the first run
    const testParams = Object.assign(multiComparison.params, { skipPrewarm })

    // Start next comparison
    const resolvedURL = await resolveUrl(testParams.url);
    const comparison = await this.comparisonFactory.create(resolvedURL, testParams)
    await multiComparison.optimisticSave(() => {
      multiComparison.testOverviews.push(comparison)
    })

    this.comparisonWorker.next(comparison)
  }

  /**
   * Cancels the given multi comparison.
   */
  async cancel(multiComparison: model.BulkTest): Promise<boolean> {
    if (isFinished(multiComparison)) {
      return false
    }

    // Cancel all unfinished comparisons
    const unfinished = multiComparison.testOverviews.filter(comparison => isUnfinished(comparison))
    if (unfinished.length > 0) {
      await multiComparison.testOverviews
        .map(comparison => this.comparisonWorker.cancel(comparison))
        .reduce(parallelize)
    }

    await multiComparison.optimisticSave(() => setCanceled(multiComparison))
    return true
  }

  /**
   * Triggers the re-aggregation of a multi comparison.
   */
  async handleComparisonFinished(comparison: model.TestOverview): Promise<void> {
    const multiComparison = await this.db.BulkTest.find()
      .greaterThanOrEqualTo('createdAt', new Date(Date.now() - 1000 * 60 * 120))
      .in('testOverviews', comparison.id).singleResult()

    if (multiComparison) {
      this.db.log.info(`Comparison finished: ${comparison.id}`)

      await updateMultiComparison(this.db, multiComparison)

      this.next(multiComparison)
    }
  }

  /**
   * Finalizes a finished multi comparison.
   */
  private async finalize(multiComparison: model.BulkTest): Promise<void> {
    this.db.log.info(`MultiComparison ${multiComparison.key} is finished.`, { multiComparison })
    if (isFinished(multiComparison)) {
      this.db.log.warn(`MultiComparison ${multiComparison.key} was already finished.`, { multiComparison })
      return
    }

    if (multiComparison.params.panicMode) {
      const handled = await this.handlePanicMode(multiComparison);
      if (handled) {
        return
      }
    }

    // Save is finished state
    await this.updateFinishStatus(multiComparison)

    // Inform the listener that this multi comparison has finished
    this.listener && this.listener.handleMultiComparisonFinished(multiComparison)
  }

  private async updateUnsatisfyingComparison(multiComparison: model.BulkTest, bestComparison: model.TestOverview): Promise<void> {
    try {
      await multiComparison.load({ depth: 2 })
      const bestSpeedKit = multiComparison.testOverviews.sort((curr, next) => {
        const currFactor = curr?.speedKitTestResult?.firstView?.largestContentfulPaint || 0
        const nextFactor = next?.speedKitTestResult?.firstView?.largestContentfulPaint || 0
        return  currFactor- nextFactor
      })[0].speedKitTestResult

      const worstCompetitor = multiComparison.testOverviews.sort((curr, next) => {
        const currFactor = curr?.competitorTestResult?.firstView?.largestContentfulPaint || 0
        const nextFactor = next?.competitorTestResult?.firstView?.largestContentfulPaint || 0
        return  nextFactor - currFactor
      })[0].competitorTestResult

      const { url, mobile } = multiComparison
      const skTestId = bestSpeedKit.webPagetests[bestSpeedKit.webPagetests.length - 1].testId
      const compTestId = worstCompetitor.webPagetests[worstCompetitor.webPagetests.length - 1].testId
      const wptFilmstrip = await createFilmStrip(this.db, [compTestId, skTestId], url, !mobile)
      await bestComparison.optimisticSave((comp: model.TestOverview) => {
        comp.speedKitTestResult = bestSpeedKit
        comp.competitorTestResult = worstCompetitor
        comp.factors = this.comparisonWorker.calculateFactors(worstCompetitor, bestSpeedKit)
        comp.wptFilmstrip = wptFilmstrip
      })

      await updateMultiComparison(this.db, multiComparison, false)
    } catch (e) {
      this.db.log.error(`Cannot update unsatisfying comparison: ${e.message}`, { id: multiComparison.id, error: e.stack })
    }
  }

  /**
   * Updated the status of the corresponding multiComparison after all its testOverviews were finished
   */
  private async updateFinishStatus(multiComparison: model.BulkTest): Promise<void> {
    const testOverviews = await Promise.all(multiComparison.testOverviews.map(testOverview => testOverview.load()))
    const failed = testOverviews.every(testOverview => isFailed(testOverview))
    if (failed) {
      await multiComparison.optimisticSave(() => setFailed(multiComparison))
      return
    }

    await multiComparison.optimisticSave(() => {
      const incomplete = testOverviews.some(testOverview => isIncomplete(testOverview))
      incomplete ? setIncomplete(multiComparison) : setSuccess(multiComparison)
    })
  }

  private async handlePanicMode(multiComparison: model.BulkTest): Promise<boolean> {
    const bestComparison = this.getBestComparison(multiComparison)
    if (!bestComparison) {
      return false
    }

    const { factors } = bestComparison
    if (!factors?.largestContentfulPaint || factors.largestContentfulPaint >= PANIC_MODE_MIN_FACTOR) {
      return false
    }

    await this.updateUnsatisfyingComparison(multiComparison, bestComparison)

    // check if min factor is reached after best comparison was updated. Retry if not and limit is not reached.
    const hasMinFactor = bestComparison.factors!.largestContentfulPaint >= PANIC_MODE_MIN_FACTOR
    const limitReached = multiComparison.completedRuns >= PANIC_MODE_RETRY_LIMIT
    if (hasMinFactor || limitReached) {
      return false
    }

    await this.startNextComparison(multiComparison, false)
    return true
  }

  /**
   * Returns the best comparison of the available comparisons of a
   * multiComparison based on the factor of the largestContentfulPaint.
   */
  private getBestComparison(multiComparison: model.BulkTest): model.TestOverview | null {
    return !!multiComparison.testOverviews ? multiComparison.testOverviews.sort((curr, next) => {
      const currFactor = curr?.factors?.largestContentfulPaint || 0
      const nextFactor = next?.factors?.largestContentfulPaint || 0
      return nextFactor - currFactor
    })[0] : null
  }
}
