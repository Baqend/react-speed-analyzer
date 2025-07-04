import { baqend, model } from 'baqend'
import { ComparisonFactory } from './_ComparisonFactory'
import { ComparisonListener, ComparisonWorker } from './_ComparisonWorker'
import { parallelize } from './_helpers'
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
import { createOptimizedComparison, updateMultiComparison } from './_updateMultiComparison'
import { resolveUrl } from './resolveUrl'

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
        const isOlderThanFiveMinutes = (new Date().getTime() - multiComparison.updatedAt!.getTime()) / ONE_MINUTE > 5
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

      // Make the prewarm only on the first run
      const testParams = Object.assign(multiComparison.params, { skipPrewarm: !!currentComparison })

      // Start next comparison
      const resolvedURL = await resolveUrl(testParams.url);
      const comparison = await this.comparisonFactory.create(resolvedURL, testParams)
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
  async cancel(multiComparison: model.BulkTest, reason: string): Promise<boolean> {
    if (isFinished(multiComparison)) {
      return false
    }

    // Cancel all unfinished comparisons
    const unfinished = multiComparison.testOverviews.filter(comparison => isUnfinished(comparison))
    if (unfinished.length > 0) {
      await multiComparison.testOverviews
        .map(comparison => this.comparisonWorker.cancel(comparison, reason))
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

    if (multiComparison.runs > 4) {
      const optimizedComparison = await createOptimizedComparison(this.db, multiComparison, this.comparisonFactory)
      if (optimizedComparison) {
        await multiComparison.optimisticSave(async () => {
          multiComparison.testOverviews.push(optimizedComparison)
        })
      }
    }

    const { app, mainFactor, allowRetry } = multiComparison.params;
    const retryRequired = !multiComparison.testOverviews.find((comparison) => {
      return comparison.factors?.[mainFactor || 'largestContentfulPaint'] >= 1.5
    })

    if (app === 'makefast' && retryRequired && allowRetry) {
      // Reset existing multiComparison to start firehorse retry with a fresh instance
      await multiComparison.optimisticSave(async () => {
        multiComparison.testOverviews = []
        multiComparison.completedRuns = 0
        multiComparison.speedKitMeanValues = new this.db.Mean()
        multiComparison.competitorMeanValues = new this.db.Mean()
        multiComparison.factors = new this.db.Mean()
        multiComparison.bestFactors = new this.db.Mean()
        multiComparison.worstFactors = new this.db.Mean()
        multiComparison.params = Object.assign(multiComparison.params, { app: 'firehorse' })
      })
      return this.next(multiComparison)
    }

    // Save the finished state
    await this.updateFinishStatus(multiComparison)

    // Inform the listener that this multi comparison has finished
    this.listener && this.listener.handleMultiComparisonFinished(multiComparison)
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
}
