import { baqend, model } from 'baqend'
import { factorize } from './_updateMultiComparison'
import { callPageSpeed } from './_callPageSpeed'
import { TestListener, TestWorker } from './_TestWorker'

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
  constructor(private readonly db: baqend, private testWorker: TestWorker, private listener?: ComparisonListener) {
    this.testWorker.setListener(this)
  }

  setListener(value: ComparisonListener) {
    this.listener = value
  }

  async next(comparison: model.TestOverview) {
    this.db.log.debug(`ComparisonWorker.next("${comparison.key}")`)

    // Ensure comparison is loaded with depth 1
    await comparison.load({ depth: 1 })

    const { competitorTestResult: competitor, speedKitTestResult: speedKit } = comparison

    // Handle PageSpeed Insights
    if (this.shouldStartPageSpeedInsights(comparison)) {
      this.setPsiMetrics(comparison)
      comparison.tasks.push(new this.db.Task({
        taskType: PSI_TYPE,
        lastExecution: new Date(),
      }))
    }

    // Is TestOverview finished?
    if (competitor.hasFinished && speedKit.hasFinished) {
      this.db.log.info(`Comparison ${comparison.key} is finished.`, { comparison })
      if (comparison.hasFinished) {
        this.db.log.warn(`Comparison ${comparison.key} was already finished.`, { comparison })
        return
      }

      await comparison.ready()
      await comparison.optimisticSave((testOverview: model.TestOverview) => {
        testOverview.speedKitConfig = speedKit.speedKitConfig
        testOverview.factors = this.calculateFactors(competitor, speedKit)
        testOverview.hasFinished = true
      })

      // Inform the listener that this comparison has finished
      this.listener && this.listener.handleComparisonFinished(comparison)

      return
    }

    // Start competitor and speed kit tests
    if (!competitor.hasFinished) {
      this.testWorker.next(competitor).catch((err) => this.db.log.error(err.message, err))
    }
    if (!speedKit.hasFinished) {
      this.testWorker.next(speedKit).catch((err) => this.db.log.error(err.message, err))
    }
  }

  async handleTestFinished(test: model.TestResult): Promise<void> {
    try {
      const comparison = await this.findComparisonByTest(test)

      this.db.log.info(`Test finished: ${test.id}`)
      this.next(comparison).catch((err) => this.db.log.error(err.message, err))
    } catch (error) {
      this.db.log.error('Error while handling test result', { id: test.id, error: error.stack })
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

  /**
   * Sets the PageSpeed Insight metrics on a test overview.
   *
   * @param testOverview The test overview to get the insights for.
   * @return
   */
  private async setPsiMetrics(testOverview: model.TestOverview): Promise<void> {
    const { url, mobile } = testOverview
    try {
      const pageSpeedInsights = await callPageSpeed(url, mobile)
      await testOverview.ready()
      await testOverview.optimisticSave((test: model.TestOverview) => {
        test.psiDomains = pageSpeedInsights.domains
        test.psiRequests = pageSpeedInsights.requests
        test.psiResponseSize = `${pageSpeedInsights.bytes}`
        test.psiScreenshot = pageSpeedInsights.screenshot
      })
    } catch (error) {
      this.db.log.warn('Could not call page speed insights', { url, mobile, error: error.stack })
    }
  }

  shouldStartPageSpeedInsights(testOverview: model.TestOverview): boolean {
    if (!testOverview.tasks || !testOverview.tasks.length) {
      return true
    }
    return testOverview.tasks.map(task => task.taskType).indexOf(PSI_TYPE) === -1
  }


  private async findComparisonByTest(test: model.TestResult): Promise<model.TestOverview> {
    const testId = test.id
    const comparison = await this.db.TestOverview.find()
      .where({
        '$or': [
          { 'competitorTestResult': { '$eq': testId } },
          { 'speedKitTestResult': { '$eq': testId } },
        ],
      }).singleResult({ depth: 1 })

    this.db.log.info('Comparison found to handle test result', comparison)
    return comparison
  }
}
