import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { TestBuilder } from './_TestBuilder'
import { TestParams } from './_TestParams'
import { UrlInfo } from './_UrlInfo'

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
  create(urlInfo: UrlInfo, params: TestParams, createdBy: string | null = null, runs: number = 1): Promise<model.BulkTest> {
    const usedParams = this.testBuilder.buildParams(params, null, 9)
    const { location, mobile, priority } = usedParams

    const multiComparison: model.BulkTest = new this.db.BulkTest()
    multiComparison.url = urlInfo.url
    multiComparison.urlAnalysis = new this.db.UrlAnalysis(urlInfo)
    multiComparison.createdBy = createdBy
    multiComparison.testOverviews = []
    multiComparison.hasFinished = false
    multiComparison.location = location
    multiComparison.mobile = mobile
    multiComparison.runs = runs
    multiComparison.priority = priority
    multiComparison.completedRuns = 0
    multiComparison.params = usedParams

    return multiComparison.save()
  }
}
