import { baqend, model } from 'baqend'
import stringifyObject from 'stringify-object'
import { analyzeSpeedKit } from './_analyzeSpeedKit'
import { AsyncFactory } from './_AsyncFactory'
import { getCachedSpeedKitConfig } from './_configCaching'
import { getRootPath, getTLD } from './_getSpeedKitUrl'
import { timeout } from './_sleep'
import { DEFAULT_ACTIVITY_TIMEOUT, DEFAULT_LOCATION, DEFAULT_TIMEOUT, TestFactory } from './_TestFactory'
import { TestParams } from './_TestParams'
import { UrlInfo } from './_UrlInfo'
import { generateUniqueId } from './generateUniqueId'

/**
 * The default test params.
 */
export const DEFAULT_PARAMS: Required<TestParams> = {
  activityTimeout: DEFAULT_ACTIVITY_TIMEOUT,
  caching: false,
  location: DEFAULT_LOCATION,
  mobile: false,
  priority: 0,
  skipPrewarm: false,
  speedKitConfig: null,
  timeout: DEFAULT_TIMEOUT,
}

/**
 * Request which creates a TestOverview object and the TestResult objects that are processed
 * by the {@link ComparisonWorker} and the {@link TestWorker}.
 */
export class ComparisonFactory implements AsyncFactory<model.TestOverview> {
  constructor(private db: baqend, private testFactory: TestFactory) {
  }

  async create(urlInfo: UrlInfo, params: TestParams): Promise<model.TestOverview> {
    const config = await this.buildSpeedKitConfig(urlInfo, params)
    const requiredParams = this.buildParams(params, config)
    const configAnalysis = urlInfo.speedKitEnabled ? this.createConfigAnalysis(urlInfo, config) : null

    // Create the tests
    const [competitorTest, speedKitTest] = await Promise.all([
      this.createCompetitorTest(urlInfo, requiredParams),
      this.createSpeedKitTest(urlInfo, requiredParams),
    ])

    // Create the comparison object
    return this.createComparison(urlInfo, requiredParams, configAnalysis, competitorTest, speedKitTest)
  }

  /**
   * Builds the final test params.
   */
  private buildParams(params: TestParams, speedKitConfig: string | null): Required<TestParams> {
    return Object.assign({}, DEFAULT_PARAMS, { speedKitConfig }, params)
  }

  /**
   * Builds the Speed Kit config to use for this test.
   */
  private buildSpeedKitConfig({ url, speedKitEnabled }: UrlInfo, { mobile, speedKitConfig }: TestParams): Promise<string | null> {
    // Has the user set a config as a test parameter?
    if (speedKitConfig) {
      return Promise.resolve(speedKitConfig)
    }

    // Is Speed Kit enabled on the URL? Get its config
    if (speedKitEnabled) {
      this.db.log.info(`Extracting config from URL ${url}`)
      const analyze = analyzeSpeedKit(url, this.db).then(it => stringifyObject(it.config))
        .catch(error => {
          this.db.log.warn(`Could not analyze Speed Kit config`, { url, error: error.stack })
          return null
        })

      return timeout(5000, analyze, null)
    }

    // Create a default Speed Kit config for the URL
    return getCachedSpeedKitConfig(this.db, url, mobile!)
  }

  /**
   * Creates a config analysis of the given URL.
   */
  private createConfigAnalysis({ url, speedKitUrl }: UrlInfo, config: string | null): model.ConfigAnalysis {
    const configAnalysis = new this.db.ConfigAnalysis()
    configAnalysis.swPath = speedKitUrl

    if (!config) {
      configAnalysis.configMissing = true
      return configAnalysis
    }

    // FIXME: Do we really need to use `eval` here?
    const configObj = eval(`(${config})`)
    const rootPath = getRootPath(this.db, url)

    configAnalysis.swPathMatches = configObj.sw || rootPath + '/sw.js' === speedKitUrl
    configAnalysis.isDisabled = configObj.disabled === true

    return configAnalysis
  }

  /**
   * Create the comparison object itself.
   */
  private async createComparison(urlInfo: UrlInfo, params: Required<TestParams>, configAnalysis: model.ConfigAnalysis | null, competitorTest: model.TestResult, speedKitTest: model.TestResult): Promise<model.TestOverview> {
    const uniqueId = await generateUniqueId(this.db, 'TestOverview')
    const tld = getTLD(this.db, urlInfo.url)
    const id = uniqueId + tld.substring(0, tld.length - 1)

    const comparison = new this.db.TestOverview({ id })
    comparison.url = urlInfo.url
    comparison.caching = params.caching
    comparison.location = params.location
    comparison.mobile = params.mobile
    comparison.activityTimeout = params.activityTimeout || DEFAULT_ACTIVITY_TIMEOUT
    comparison.isSpeedKitComparison = urlInfo.speedKitEnabled
    comparison.speedKitVersion = urlInfo.speedKitVersion
    comparison.speedKitConfig = null
    comparison.configAnalysis = configAnalysis
    comparison.hasFinished = false
    comparison.competitorTestResult = competitorTest
    comparison.speedKitTestResult = speedKitTest
    comparison.tasks = []
    comparison.isSecured = urlInfo.secured

    return comparison.save()
  }

  /**
   * Creates a competitor test from params.
   */
  private createCompetitorTest(urlInfo: UrlInfo, params: Required<TestParams>): Promise<model.TestResult> {
    return this.createTest(false, urlInfo, params)
  }

  /**
   * Creates a Speed Kit test from params.
   */
  private createSpeedKitTest(urlInfo: UrlInfo, params: Required<TestParams>): Promise<model.TestResult> {
    return this.createTest(true, urlInfo, params)
  }

  /**
   * Creates a test from params.
   */
  private createTest(isClone: boolean, urlInfo: UrlInfo, params: Required<TestParams>) {
    return this.testFactory.create(urlInfo, isClone, params)
  }
}
