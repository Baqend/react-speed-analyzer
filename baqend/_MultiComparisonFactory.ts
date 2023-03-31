import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { truncateUrl } from './_helpers'
import { setFailed, setRunning } from './_Status'
import { TestBuilder } from './_TestBuilder'
import { TestParams } from './_TestParams'
import { resolveUrl } from './resolveUrl'

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
  async create(params: TestParams, createdBy: string | null = null, runs: number = 1): Promise<model.BulkTest> {
    const usedParams = this.testBuilder.buildSingleTestParams(params, null, 9)
    const { location, mobile, priority, url } = usedParams

    const multiComparison: model.BulkTest = new this.db.BulkTest()
    try {
      const resolvedURL = await resolveUrl(url)
      const truncatedUrl = await truncateUrl(resolvedURL)
      multiComparison.url = truncatedUrl
      multiComparison.displayUrl = truncatedUrl
      usedParams.url = truncatedUrl
      setRunning(multiComparison)
    } catch(e) {
      multiComparison.url = url
      setFailed(multiComparison)
      this.db.log.warn(`Error while multiComparison creation`, { id: multiComparison.id, error: e.stack })
    }

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
