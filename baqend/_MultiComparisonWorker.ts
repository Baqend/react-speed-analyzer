import { baqend, model } from 'baqend'
import { ComparisonFactory } from './_ComparisonFactory'
import { ComparisonListener, ComparisonWorker } from './_ComparisonWorker'
import { parallelize } from './_helpers'
import {
  isFinished,
  isIncomplete,
  isUnfinished,
  setCanceled,
  setIncomplete,
  setRunning,
  setSuccess,
  Status,
} from './_Status'
import { updateMultiComparison } from './_updateMultiComparison'

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
        return
      }

      // Are all planned comparisons finished?
      if (testOverviews.length >= runs) {
        await this.finalize(multiComparison)
        return
      }

      // Make the prewarm only on the first run
      const testParams = Object.assign(multiComparison.params, { skipPrewarm: !!currentComparison })

      // Start next comparison
      const comparison = await this.comparisonFactory.create(multiComparison.puppeteer!, testParams, true)
      await multiComparison.optimisticSave(() => {
        multiComparison.testOverviews.push(comparison)
      })

      this.comparisonWorker.next(comparison)
    } catch (error) {
      this.db.log.warn(`Error while next iteration`, { id: multiComparison.id, error: error.stack })
    }
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
    const multiComparison = await this.db.BulkTest.find().in('testOverviews', comparison.id).singleResult()
    if (multiComparison) {
      console.log(`Comparison finished: ${comparison.id}`)

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

    // Save is finished state
    const isIncomplete = await this.isComparisonIncomplete(multiComparison)
    await multiComparison.optimisticSave(() => {
      isIncomplete ? setIncomplete(multiComparison) : setSuccess(multiComparison)
    })

    // Inform the listener that this multi comparison has finished
    this.listener && this.listener.handleMultiComparisonFinished(multiComparison)
  }

  /**
   * Checks whether one of the corresponding testOverview is incomplete
   */
  private async isComparisonIncomplete(multiComparison: model.BulkTest): Promise<boolean> {
    const testOverviews = await Promise.all(multiComparison.testOverviews.map(testOverview => testOverview.load()))
    return testOverviews.some(testOverview => isIncomplete(testOverview))
  }
}
