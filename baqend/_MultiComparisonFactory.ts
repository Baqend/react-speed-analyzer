import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { TestBuilder } from './_TestBuilder'
import { TestParams } from './_TestParams'

/**
 * Creates multi comparisons, which are comparisons with multiple runs.
 */
export class MultiComparisonFactory implements AsyncFactory<model.BulkTest> {
  constructor(
    private readonly db: baqend,
    private readonly testBuilder: TestBuilder,
  ) {
  }

  /**
   * Creates the object which is demanded by this factory.
   *
   * @return A promise which resolves with the created object.
   */
  create(puppeteer: model.Puppeteer, params: TestParams, createdBy: string | null = null, runs: number = 1): Promise<model.BulkTest> {
    const usedParams = this.testBuilder.buildSingleTestParams(params, null, 9)
    const { location, mobile, priority } = usedParams

    // Repopulate the class
    if (!(puppeteer instanceof this.db.Puppeteer)) {
      puppeteer.stats = new this.db.PuppeteerStats(puppeteer.stats)
      puppeteer.type = new this.db.PuppeteerType(puppeteer.type)
      puppeteer.speedKit = puppeteer.speedKit ? new this.db.PuppeteerSpeedKit(puppeteer.speedKit) : null
      puppeteer = new this.db.Puppeteer(puppeteer)
    }

    const multiComparison: model.BulkTest = new this.db.BulkTest()
    multiComparison.url = puppeteer.url
    multiComparison.status = 'QUEUED'
    multiComparison.hasFinished = false
    multiComparison.puppeteer = puppeteer
    multiComparison.createdBy = createdBy
    multiComparison.testOverviews = []
    multiComparison.location = location
    multiComparison.mobile = mobile
    multiComparison.runs = runs
    multiComparison.priority = priority
    multiComparison.completedRuns = 0
    multiComparison.params = usedParams

    return multiComparison.save()
  }
}
