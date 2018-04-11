import { baqend, model } from 'baqend'
import { AnalyzerRequest } from './_AnalyzerRequest'
import { DEFAULT_LOCATION, DEFAULT_ACTIVITY_TIMEOUT } from './_TestRequest'
import { ComparisonParams } from './_ComparisonRequest'

const defaultParams = {
  activityTimeout: DEFAULT_ACTIVITY_TIMEOUT,
  runs: 1,
  caching: false,
  location: DEFAULT_LOCATION,
  mobile: false,
  priority: 9,
}

/**
 * @param db The Baqend instance.
 * @param {string | null} createdBy A reference to the user who created the bulk test.
 * @param {string} url The URL under test.
 * @param {string} whitelist A whitelist to use for the test.
 * @param {boolean} speedKitConfig Configuration for the speed kit snippet.
 * @param {number} [activityTimeout] The timeout when the test should be aborted.
 * @param {string} [location] The server location to execute the test.
 * @param {number} [runs] The number of runs to execute.
 * @param {boolean} [caching] If true, browser caching will be used. Defaults to false.
 * @param {boolean} [mobile] If true, mobile version will be tested. Defaults to false.
 * @param {number} [priority=9] Defines the test's priority, from 0 (highest) to 9 (lowest).
 * @return {Promise<BulkTest>} A promise resolving when the bulk test has been created.
 */
export class MultiComparisonRequest implements AnalyzerRequest<model.BulkTest> {
  private readonly params: any

  constructor(private db: baqend, private createdBy: string, params: model.ComparisonInfo) {
    this.params = Object.assign(defaultParams, params)
  }

  create(): Promise<model.BulkTest> {
    const { url, location, mobile, priority, runs } = this.params

    const multiComparison: model.BulkTest = new this.db.BulkTest()
    multiComparison.url = url
    multiComparison.testOverviews = []
    multiComparison.createdBy = this.createdBy
    multiComparison.hasFinished = false
    multiComparison.location = location
    multiComparison.mobile = mobile
    multiComparison.runs = runs
    multiComparison.priority = priority
    multiComparison.completedRuns = 0
    multiComparison.params = this.params

    return multiComparison.save()
  }
}
