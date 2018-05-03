import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { ConfigCache } from './_ConfigCache'
import { ConfigGenerator } from './_ConfigGenerator'
import { getRootPath, getTLD } from './_getSpeedKitUrl'
import { DataType, Serializer } from './_Serializer'
import { TestBuilder } from './_TestBuilder'
import { TestFactory } from './_TestFactory'
import { TestParams } from './_TestParams'
import { generateUniqueId } from './generateUniqueId'

/**
 * Request which creates a TestOverview object and the TestResult objects that are processed
 * by the {@link ComparisonWorker} and the {@link TestWorker}.
 */
export class ComparisonFactory implements AsyncFactory<model.TestOverview> {
  constructor(
    private db: baqend,
    private testFactory: TestFactory,
    private testBuilder: TestBuilder,
    private configCache: ConfigCache,
    private configGenerator: ConfigGenerator,
    private serializer: Serializer,
  ) {
  }

  /**
   * Creates the object which is demanded by this factory.
   *
   * @return A promise which resolves with the created object.
   */
  async create(puppeteer: model.Puppeteer, params: TestParams, hasMultiComparison: boolean = false): Promise<model.TestOverview> {
    const config = await this.buildSpeedKitConfig(puppeteer, params)
    const requiredParams = this.testBuilder.buildSingleTestParams(params, config)
    const configAnalysis = puppeteer.speedKit ? this.createConfigAnalysis(puppeteer.url, puppeteer.speedKit) : null

    // Create the tests
    const [competitorTest, speedKitTest] = await Promise.all([
      this.createCompetitorTest(puppeteer, requiredParams),
      this.createSpeedKitTest(puppeteer, requiredParams),
    ])

    // Create the comparison object
    return this.createComparison(puppeteer, requiredParams, configAnalysis, competitorTest, speedKitTest, hasMultiComparison)
  }

  /**
   * Builds the Speed Kit config to use for this test.
   */
  private async buildSpeedKitConfig({ url, speedKit, domains }: model.Puppeteer, { mobile, speedKitConfig }: TestParams): Promise<string | null> {
    // Has the user set a config as a test parameter?
    if (speedKitConfig) {
      return speedKitConfig
    }

    // Is Speed Kit enabled on the URL? Get its config
    this.db.log.info(`${url} has Speed Kit: ${speedKit !== null ? 'yes' : 'no'}`)
    if (speedKit) {
      this.db.log.info(`Extracting config from URL: ${url}`)
      const { config } = speedKit
      const denormalize = this.serializer.denormalize(config)

      return this.serializer.serialize(denormalize, DataType.JAVASCRIPT)
    }

    // Create a default Speed Kit config for the URL
    const cachedConfig = await this.configCache.get(url, mobile!)
    if (cachedConfig) {
      return this.serializer.serialize(cachedConfig, DataType.JAVASCRIPT)
    }

    // Generate smart config and cache it
    const smartConfig = await this.configGenerator.generateSmart(url, domains, mobile)
    await this.configCache.put(url, mobile!, smartConfig)

    return this.serializer.serialize(smartConfig, DataType.JAVASCRIPT)
  }

  /**
   * Creates a config analysis of the given URL.
   */
  private createConfigAnalysis(url: string, { config, swUrl }: model.PuppeteerSpeedKit): model.ConfigAnalysis {
    const configAnalysis: model.ConfigAnalysis = new this.db.ConfigAnalysis()
    configAnalysis.swPath = swUrl

    if (!config) {
      configAnalysis.configMissing = true
      return configAnalysis
    }

    const rootPath = getRootPath(this.db, url)

    configAnalysis.configMissing = false
    configAnalysis.swPathMatches = config.sw || rootPath + '/sw.js' === swUrl
    configAnalysis.isDisabled = config.disabled === true

    return configAnalysis
  }

  /**
   * Create the comparison object itself.
   */
  private async createComparison(puppeteer: model.Puppeteer, params: Required<TestParams>, configAnalysis: model.ConfigAnalysis | null, competitorTest: model.TestResult, speedKitTest: model.TestResult, hasMultiComparison: boolean = false): Promise<model.TestOverview> {
    const { url, displayUrl, speedKit } = puppeteer
    const uniqueId = await generateUniqueId(this.db, 'TestOverview')
    const tld = getTLD(this.db, url)
    const id = uniqueId + tld.split('.')[0]

    // Initialize
    const comparison = new this.db.TestOverview({ id })
    comparison.hasFinished = false
    comparison.configAnalysis = configAnalysis
    comparison.competitorTestResult = competitorTest
    comparison.speedKitTestResult = speedKitTest
    comparison.tasks = []

    // Copy Puppeteer info
    const speedKitVersion = speedKit !== null ? `${speedKit.major}.${speedKit.minor}.${speedKit.patch}` : null
    comparison.url = url
    comparison.displayUrl = displayUrl
    comparison.puppeteer = puppeteer
    comparison.isSpeedKitComparison = speedKit !== null
    comparison.speedKitVersion = speedKitVersion
    comparison.isSecured = url.startsWith('https://')
    comparison.type = puppeteer.type.framework
    comparison.psiDomains = puppeteer.stats.domains
    comparison.psiRequests = puppeteer.stats.requests
    comparison.psiResponseSize = puppeteer.stats.size.toString()
    if (puppeteer.screenshot) {
      comparison.psiScreenshot = puppeteer.screenshot
    }

    // Copy params
    comparison.caching = params.caching
    comparison.location = params.location
    comparison.mobile = params.mobile
    comparison.activityTimeout = params.activityTimeout
    comparison.speedKitConfig = params.speedKitConfig
    comparison.hasMultiComparison = hasMultiComparison

    return comparison.save()
  }

  /**
   * Creates a competitor test from params.
   */
  private createCompetitorTest(puppeteer: model.Puppeteer, params: Required<TestParams>): Promise<model.TestResult> {
    return this.createTest(false, puppeteer, params)
  }

  /**
   * Creates a Speed Kit test from params.
   */
  private createSpeedKitTest(puppeteer: model.Puppeteer, params: Required<TestParams>): Promise<model.TestResult> {
    return this.createTest(true, puppeteer, params)
  }

  /**
   * Creates a test from params.
   */
  private createTest(isClone: boolean, puppeteer: model.Puppeteer, params: Required<TestParams>) {
    return this.testFactory.create(puppeteer, isClone, params)
  }
}
