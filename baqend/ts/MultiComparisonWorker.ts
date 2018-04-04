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

  next(multiComparisonId: string) {
    this.db.log.info("MultiComparisonWorker next", multiComparisonId)
    this.db.BulkTest.load(multiComparisonId, {depth: 1})
      .then(multiComparison => multiComparison.ready().then(() => {
        const { testOverviews, runs } = multiComparison
        const currentTestOverview = testOverviews[testOverviews.length - 1]
        if (testOverviews.length < 1 || currentTestOverview.hasFinished) {
          if (testOverviews.length === runs) {
            multiComparison.hasFinished = true
            multiComparison.ready().then(() => multiComparison.save())

            this.listener && this.listener.handleMultiComparisonFinished(multiComparison)
          } else {
            this.comparisonWorker.next(currentTestOverview.id)
          }
        }
      }))
      .catch(error => this.db.log.warn(`Error while next iteration`, {id: multiComparisonId, error: error.stack}))
  }

  async handleComparisonFinished(comparison: model.TestOverview): Promise<void> {
    const multiComparison = await this.db.BulkTest.find().in('testOverviews', comparison.id).singleResult()
    if (multiComparison) {
      this.next(multiComparison.id)
    }
  }
}
