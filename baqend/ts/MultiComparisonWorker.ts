import { baqend, model } from 'baqend'
import { ComparisonListener, ComparisonWorker } from './ComparisonWorker'

export interface MultiComparisonListener {
  handleMultiComparisonFinished(multiComparison: model.BulkTest): any
}

export class MultiComparisonWorker implements ComparisonListener {
  constructor(
    private db: baqend,
    private comparisonWorker: ComparisonWorker,
    private listener?: MultiComparisonListener,
  ) {
    this.comparisonWorker.setListener(this)
  }

  setListener(value: MultiComparisonListener) {
    this.listener = value
  }

  async next(multiComparisonId: string) {
    this.db.log.info(`MultiComparisonWorker.next("${multiComparisonId}")`)
    try {
      const multiComparison: model.BulkTest = await this.db.BulkTest.load(multiComparisonId, { depth: 2 })
      const { testOverviews, runs } = multiComparison
      const currentTestOverview = testOverviews[testOverviews.length - 1]
      if (testOverviews.length < 1 || currentTestOverview.hasFinished) {
        if (testOverviews.length === runs) {
          this.db.log.info(`MultiComparison ${multiComparison.key} is finished.`, { multiComparison })
          if (multiComparison.hasFinished) {
            this.db.log.warn(`MultiComparison ${multiComparison.key} was already finished.`, { multiComparison })
            return
          }

          // Save is finished state
          await multiComparison.optimisticSave((it: model.BulkTest) => {
            it.hasFinished = true
          })

          this.listener && this.listener.handleMultiComparisonFinished(multiComparison)
        } else {
          this.comparisonWorker.next(currentTestOverview)
        }
      }
    } catch (error) {
      this.db.log.warn(`Error while next iteration`, { id: multiComparisonId, error: error.stack })
    }
  }

  async handleComparisonFinished(comparison: model.TestOverview): Promise<void> {
    const multiComparison = await this.db.BulkTest.find().in('testOverviews', comparison.id).singleResult()
    if (multiComparison) {
      console.log(`Comparison finished: ${comparison.id}`)
      this.next(multiComparison.id)
    }
  }
}
