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
    this.db.log.info(`BulkComparisonWorker.next("${bulkComparison.key}")`)
    try {
      // Ensure bulk comparison is loaded with depth 1
      await bulkComparison.load({ depth: 1 })
      const { multiComparisons, createdBy } = bulkComparison

      // Is there an active multi comparison which is not finished?
      const currentMultiComparison = multiComparisons[multiComparisons.length - 1]
      if (currentMultiComparison && !currentMultiComparison.hasFinished) {
        return
      }

      const nextMultiComparison = this.getNextMultiComparison(bulkComparison)
      if (!nextMultiComparison) {
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
      const { urlInfo, runs, ...params } = nextMultiComparison
      const multiComparison = await this.multiComparisonFactory.create(urlInfo, params, createdBy, runs)

      await bulkComparison.ready()
      await bulkComparison.optimisticSave((it: model.BulkComparison) => {
        nextMultiComparison.url = urlInfo.url
        it.multiComparisons.push(multiComparison)
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

  private getNextMultiComparison(bulkComparison: model.BulkComparison): model.ComparisonInfo | undefined {
    const { multiComparisons, comparisonsToStart } = bulkComparison

    return comparisonsToStart.find(comparison => {
      return !multiComparisons.some(multiComparison => multiComparison.url === comparison.urlInfo.url)
    })
  }
}
