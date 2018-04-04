import { baqend, model } from 'baqend'
import { factorize } from './updateBulkComparison'
import { callPageSpeed } from './callPageSpeed'
import { TestListener, TestWorker } from './TestWorker'

const PSI_TYPE = 'psi'

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
  constructor(private db: baqend, private testWorker: TestWorker, private listener?: ComparisonListener) {
    this.testWorker.setListener(this)
  }

  setListener(value: ComparisonListener) {
    this.listener = value
  }

  async next(testOverviewId: string) {
    this.db.log.info('ComparisonWorker next', testOverviewId)

    const testOverview: model.TestOverview = await this.db.TestOverview.load(testOverviewId, { depth: 1 })
    const { competitorTestResult, speedKitTestResult } = testOverview

    this.testWorker.next(competitorTestResult.id).catch(this.db.log.error)
    this.testWorker.next(speedKitTestResult.id).catch(this.db.log.error)

    if (this.shouldStartPageSpeedInsights(testOverview)) {
      this.setPsiMetrics(testOverview)
      testOverview.tasks.push(new this.db.Task({
        taskType: PSI_TYPE,
        lastExecution: new Date(),
      }))
    }

    // Finish testOverview
    if (competitorTestResult.hasFinished && speedKitTestResult.hasFinished) {
      testOverview.speedKitConfig = speedKitTestResult.speedKitConfig
      testOverview.factors = this.calculateFactors(competitorTestResult, speedKitTestResult)
      testOverview.hasFinished = true

      testOverview.ready().then(() => testOverview.save())

      this.listener && this.listener.handleComparisonFinished(testOverview)
    }
  }

  async handleTestFinished(test: model.TestResult): Promise<void> {
    const testResultId = test.id
    try {
      this.db.log.info('Handle comparison result', testResultId)
      const testOverview = await this.loadTestOverview(testResultId)

      this.next(testOverview.id).catch(this.db.log.error)
    } catch (error) {
      this.db.log.error('Error while handling test result', { id: testResultId, error: error.stack })
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

  private setPsiMetrics(testOverview: model.TestOverview) {
    const { url, mobile } = testOverview
    callPageSpeed(url, mobile)
      .then(pageSpeedInsights => {
        testOverview.psiDomains = pageSpeedInsights.domains
        testOverview.psiRequests = pageSpeedInsights.requests
        testOverview.psiResponseSize = `${pageSpeedInsights.bytes}`
        testOverview.psiScreenshot = pageSpeedInsights.screenshot
      })
      .then(() => testOverview.ready().then(() => testOverview.save()))
      .catch(error => {
        this.db.log.warn('Could not call page speed insights', { url, mobile, error: error.stack })
      })
  }

  shouldStartPageSpeedInsights(testOverview: model.TestOverview): boolean {
    if (!testOverview.tasks || !testOverview.tasks.length) {
      return true
    }
    return testOverview.tasks.map(task => task.taskType).indexOf(PSI_TYPE) === -1
  }


  private async loadTestOverview(testResultId: string): Promise<model.TestOverview> {
    const testOverview = await this.db.TestOverview.find()
      .where({
        '$or': [
          { 'competitorTestResult': { '$eq': testResultId } },
          { 'speedKitTestResult': { '$eq': testResultId } },
        ],
      }).singleResult()

    this.db.log.info('Comparison found to handle test result', testOverview)
    return testOverview
  }
}
