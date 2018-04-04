import { baqend, model } from 'baqend'
import { MultiComparisonRequest } from './MultiComparisonRequest'
import { MultiComparisonListener, MultiComparisonWorker } from './MultiComparisonWorker'

export class BulkComparisonWorker implements MultiComparisonListener {
  constructor(private db: baqend, private multiComparisonWorker: MultiComparisonWorker) {
    this.multiComparisonWorker.setListener(this)
  }

  async next(bulkComparisonId: string) {
    this.db.log.info('BulkComparisonWorker next', bulkComparisonId)
    try {
      const bulkComparison = await this.db.BulkComparison.load(bulkComparisonId, { depth: 1 })
      await bulkComparison.ready()
      const { multiComparisons, createdBy } = bulkComparison
      const currentMultiComparison = multiComparisons[multiComparisons.length - 1]
      if (multiComparisons.length > 0 && !currentMultiComparison.hasFinished) {
        return
      }

      const nextMultipleComparison = this.getNextMultipleComparison(bulkComparison)
      if (!nextMultipleComparison) {
        return bulkComparison.optimisticSave((it: model.BulkComparison) => {
          it.hasFinished = true
        })
      }

      const multiComparisonRequest = new MultiComparisonRequest(this.db, createdBy, nextMultipleComparison)
      const multiComparison = await multiComparisonRequest.create()
      bulkComparison.multiComparisons.push(multiComparison)
      bulkComparison.ready().then(() => bulkComparison.save())

      this.multiComparisonWorker.next(multiComparison.id)
    } catch (error) {
      this.db.log.warn(`Error while next iteration`, { id: bulkComparisonId, error: error.stack })
    }
  }

  async handleMultiComparisonFinished(multiComparison: model.BulkTest): Promise<void> {
    const bulkComparison = await this.db.BulkComparison.find().in('multiComparisons', multiComparison.id).singleResult()
    if (bulkComparison) {
      this.next(bulkComparison.id)
    }
  }

  private getNextMultipleComparison(bulkComparison: model.BulkComparison) {
    const { multiComparisons, comparisonsToStart } = bulkComparison

    return comparisonsToStart.find(comparison => {
      return multiComparisons.filter(multiComparison => multiComparison.url === comparison.url).length === 0
    })
  }
}
