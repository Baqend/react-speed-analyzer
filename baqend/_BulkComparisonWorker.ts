import { baqend, model } from 'baqend'
import { MultiComparisonFactory } from './_MultiComparisonFactory'
import { MultiComparisonListener, MultiComparisonWorker } from './_MultiComparisonWorker'

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
      await bulkComparison.load({ depth: 1 })

      // Is this bulk comparison already finished?
      if (bulkComparison.hasFinished) {
        return
      }

      const { multiComparisons, createdBy } = bulkComparison

      // Is there an active multi comparison which is not finished?
      const currentMultiComparison = multiComparisons[multiComparisons.length - 1]
      if (currentMultiComparison && !currentMultiComparison.hasFinished) {
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
        await bulkComparison.ready()
        await bulkComparison.optimisticSave((it: model.BulkComparison) => {
          it.hasFinished = true
        })

        // TODO: Add new listener here?
        return
      }

      // Start next multi comparison
      const { puppeteer, runs, ...params } = bulkComparison.comparisonsToStart[nextIndex]
      const multiComparison = await this.multiComparisonFactory.create(puppeteer, params, createdBy, runs)

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

  async handleMultiComparisonFinished(multiComparison: model.BulkTest): Promise<void> {
    const bulkComparison = await this.db.BulkComparison.find().in('multiComparisons', multiComparison.id).singleResult()
    if (bulkComparison) {
      console.log(`Multi comparison finished: ${multiComparison.id}`)
      this.next(bulkComparison)
    }
  }

  private getNextIndex(bulkComparison: model.BulkComparison): number {
    const { comparisonsToStart } = bulkComparison

    return comparisonsToStart.findIndex(comparison => !comparison.isStarted)
  }
}
