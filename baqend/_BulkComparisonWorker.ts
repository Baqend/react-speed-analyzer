import { baqend, model } from 'baqend'
import { MultiComparisonFactory } from './_MultiComparisonFactory'
import { MultiComparisonListener, MultiComparisonWorker } from './_MultiComparisonWorker'
import {
  isFailed,
  isFinished,
  isIncomplete,
  isPending,
  isUnfinished,
  setCanceled,
  setFailed,
  setIncomplete,
  setPending,
  setRunning,
  setSuccess,
  Status,
} from './_Status'
import { parallelize } from './_helpers'

export class BulkComparisonWorker implements MultiComparisonListener {
  constructor(
    private readonly db: baqend,
    private readonly multiComparisonFactory: MultiComparisonFactory,
    private readonly multiComparisonWorker: MultiComparisonWorker,
  ) {
    this.multiComparisonWorker.setListener(this)
  }

  async next(bulkComparison: model.BulkComparison) {
    this.db.log.debug(`BulkComparisonWorker.next("${bulkComparison.key}")`)
    try {
      // Ensure bulk comparison is loaded with depth 1
      await bulkComparison.load({ depth: 1, refresh: true })

      // Is this bulk comparison already finished?
      if (isFinished(bulkComparison)) {
        return
      }

      // Set bulk comparison to running
      if (bulkComparison.status !== Status.RUNNING && bulkComparison.status !== Status.PENDING) {
        await bulkComparison.optimisticSave(() => setRunning(bulkComparison))
      }

      const { multiComparisons, createdBy } = bulkComparison

      // Is there an active multi comparison which is not finished?
      const currentMultiComparison = multiComparisons[multiComparisons.length - 1]
      if (currentMultiComparison
        && !currentMultiComparison.hasFinished
        && currentMultiComparison.status !== Status.PENDING) {
        return
      }

      const nextIndex = this.getNextIndex(bulkComparison)
      if (nextIndex < 0) {
        this.db.log.info(`BulkComparison ${bulkComparison.key} is finished.`, { bulkComparison })
        if (bulkComparison.hasFinished) {
          this.db.log.warn(`BulkComparison ${bulkComparison.key} was already finished.`, { bulkComparison })
          return
        }

        // Save is finished state
        const multiComparisons =  await Promise.all(bulkComparison.multiComparisons.map(multiComparison => multiComparison.load()))
        await bulkComparison.optimisticSave(() => {
          if (this.isBulkPending(multiComparisons)) {
            setPending(bulkComparison)
            return
          }

          if (this.isBulkFailed(multiComparisons)) {
            setFailed(bulkComparison)
            return
          }

          if (this.isBulkIncomplete(multiComparisons)){
            setIncomplete(bulkComparison)
            return
          }

          setSuccess(bulkComparison)
        })

        return
      }

      // Start next multi comparison
      const { runs, ...params } = bulkComparison.comparisonsToStart[nextIndex]
      const multiComparison = await this.multiComparisonFactory.create(params, createdBy, runs)

      await bulkComparison.ready()
      await bulkComparison.optimisticSave((it: model.BulkComparison) => {
        it.multiComparisons.push(multiComparison)
        Object.assign(it.comparisonsToStart[nextIndex], { isStarted: true, multiComparisonId: multiComparison.id })
      })

      this.multiComparisonWorker.next(multiComparison)
    } catch (error) {
      this.db.log.warn(`Error while next iteration`, { id: bulkComparison.id, error: error.stack })
    }
  }

  /**
   * Checks whether one of the corresponding testOverview is incomplete
   */
  isBulkIncomplete(multiComparisons: model.BulkTest[]): boolean {
    return multiComparisons.some(multiComparison => isIncomplete(multiComparison))
  }

  /**
   * Checks whether one of the corresponding testOverview is incomplete
   */
  isBulkFailed(multiComparisons: model.BulkTest[]): boolean {
    return multiComparisons.every(multiComparison => isFailed(multiComparison))
  }

  /**
   * Checks whether one of the corresponding testOverview is incomplete
   */
  isBulkPending(multiComparisons: model.BulkTest[]): boolean {
    return multiComparisons.some(multiComparison => isPending(multiComparison))
  }

  /**
   * Cancels the given bulk comparison.
   */
  async cancel(bulkComparison: model.BulkComparison): Promise<boolean> {
    if (isFinished(bulkComparison)) {
      return false
    }

    // Cancel all unfinished multi comparisons
    const unfinished = bulkComparison.multiComparisons.filter(multiComparison => isUnfinished(multiComparison))
    if (unfinished.length > 0) {
      await bulkComparison.multiComparisons
        .map(multiComparison => this.multiComparisonWorker.cancel(multiComparison))
        .reduce(parallelize)
    }

    await bulkComparison.optimisticSave(() => setCanceled(bulkComparison))
    return true
  }

  async handleMultiComparisonFinished(multiComparison: model.BulkTest): Promise<void> {
    const bulkComparison = await this.db.BulkComparison.find().in('multiComparisons', multiComparison.id).singleResult()
    if (bulkComparison) {
      this.db.log.info(`Multi comparison finished: ${multiComparison.id}`)
      this.next(bulkComparison)
    }
  }

  private getNextIndex(bulkComparison: model.BulkComparison): number {
    const { comparisonsToStart } = bulkComparison

    return comparisonsToStart.findIndex(comparison => !comparison.isStarted)
  }
}
