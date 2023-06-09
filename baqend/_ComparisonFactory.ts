import { baqend, binding, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { Config } from './_Config'
import { ConfigCache } from './_ConfigCache'
import { ConfigGenerator } from './_ConfigGenerator'
import { getTLD } from './_getSpeedKitUrl'
import { cancelTest, generateHash, truncateUrl, urlToFilename } from './_helpers'
import { Pagetest } from './_Pagetest'
import { DataType, Serializer } from './_Serializer'
import { setFailed, setRunning } from './_Status'
import { TestBuilder } from './_TestBuilder'
import { TestFactory } from './_TestFactory'
import { TestParams } from './_TestParams'
import { toFile } from './_toFile'
import credentials from './credentials'
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
  async create(url: string, params: TestParams): Promise<model.TestOverview> {
    // Create the comparison object
    const comparison = await this.createComparison(url)

    // Update the comparison object with detailed information
    return this.updateComparison(url, comparison, params)
  }

  /**
   * Create the comparison object itself.
   */
  async createComparison(url: string, hostname?: string) {
    const uniqueId = await generateUniqueId(this.db, 'TestOverview')
    const tld = getTLD(url, this.db.log)
    const id = uniqueId + tld.split('.')[0]

    // Initialize
    const comparison = new this.db.TestOverview({ id })
    comparison.url = await truncateUrl(url)
    comparison.puppeteer = new this.db.Puppeteer({ scheme: '', protocol: '' }) // dummy Puppeteer needed for Plesk

    if (hostname) {
      comparison.metaData = { hostname, pageViews: 0 }
    }

    return comparison.save()
  }

  async updateComparison(url: string, comparison: model.TestOverview, params: TestParams): Promise<model.TestOverview> {
    const requiredParams = this.testBuilder.buildSingleTestParams(params)

    // Create the tests
    const [competitorTest, speedKitTest] = await Promise.all([
      this.createCompetitorTest(url, requiredParams),
      this.createSpeedKitTest(url, requiredParams),
    ])

    comparison.competitorTestResult = competitorTest
    comparison.speedKitTestResult = speedKitTest
    comparison.tasks = []
    comparison.url = await truncateUrl(url)
    comparison.isSecured = url.startsWith('https://')

    // Copy params
    comparison.displayUrl = params.url
    comparison.caching = requiredParams.caching
    comparison.location = requiredParams.location
    comparison.mobile = requiredParams.mobile
    comparison.activityTimeout = requiredParams.activityTimeout
    comparison.speedKitConfig = requiredParams.speedKitConfig
    setRunning(comparison)

    return comparison.save()
  }

  async updateComparisonWithCompetitorData(comparison: model.TestOverview, competitor: model.TestResult): Promise<void> {
    const { url, mobile, speedKitTestResult, speedKitConfig } = comparison
    const { webPagetests, firstView, testInfo, controllingSW, framework, speedKitConfig: speedKit } = competitor
    if (!firstView) {
      throw new Error('No firstView for competitor test.')
    }

    const { preload, whitelist, ignoreConfig } = testInfo
    const { domains, resources } = firstView
    const app = testInfo.appName || credentials.app
    const domainList = domains.map(domain => domain.url)
    const whitelistArray = (whitelist || '').replace(/\s/g,'').split(',')
    const smartConfig =
      await this.configGenerator.generateSmart(url, mobile, true, preload, app, whitelistArray, {
        domains: domainList,
        resources,
      })

    const isSpeedKitComparison = !!speedKit && !/disabled:[^,]*true/.test(speedKit)
    const config = await this.buildSpeedKitConfig(url, smartConfig, ignoreConfig, speedKitConfig, speedKit)
    await speedKitTestResult.ready()
    await speedKitTestResult.optimisticSave((speedKit: model.TestResult) => {
      speedKit.speedKitConfig = config
      speedKitTestResult.testInfo.isSpeedKitComparison = isSpeedKitComparison
    })

    const isDesktop = !competitor.testInfo.testOptions.mobile
    const testId = webPagetests[webPagetests.length - 1].testId
    const wptScreenshot = await this.createScreenshot(testId, url, isDesktop)


    const speedKitVersion = isSpeedKitComparison ? this.parseSpeedKitVersion(firstView) : null
    const configAnalysis = this.createConfigAnalysis(speedKit, controllingSW)

    await comparison.ready()
    await comparison.optimisticSave((comp: model.TestOverview) => {
      comp.type = framework
      comp.speedKitConfig = config
      comp.psiScreenshot = wptScreenshot
      comp.configAnalysis = configAnalysis
      comp.speedKitVersion = speedKitVersion
      comp.isSpeedKitComparison = isSpeedKitComparison
    })
  }

  /**
   * Sets the given error on the comparison.
   */
  async updateComparisonWithError(
    comparison: model.TestOverview,
    api: Pagetest,
    error: { message: string, status: number }
  ): Promise<void> {
    const { competitorTestResult, speedKitTestResult } = comparison
    if (competitorTestResult) {
      cancelTest(competitorTestResult, api)
      await competitorTestResult.optimisticSave((test: model.TestResult) => setFailed(test))
    }

    if (speedKitTestResult) {
      cancelTest(speedKitTestResult, api)
      await speedKitTestResult.optimisticSave((test: model.TestResult) => setFailed(test))
    }

    await comparison.optimisticSave((comp: model.TestOverview) => {
      // use default params => needed for plesk
      comp.caching = false
      comp.mobile = false
      comp.isSpeedKitComparison = false
      comp.error = error
      setFailed(comp)
    })
  }

  /**
   * Parses the Speed Kit version out of the first request that has the 'skversion' parameter.
   * Returns null if no request was found.
   * @param view
   * @private
   */
  private parseSpeedKitVersion(view: model.Run): string | null {
    const { resources } = view
    if (!resources || !resources.length) {
      return null
    }

    const requestWithSkVersion = resources.find(r => r.url.includes('skversion'))
    if (!requestWithSkVersion) {
      return null
    }

    try {
      return new URL(requestWithSkVersion.url).searchParams.get('skversion')
    } catch(e) {
      return null
    }
  }

  /**
   * @param testId
   * @param url
   * @param isDesktop
   */
  private async createScreenshot(testId: string, url: string, isDesktop: boolean = true): Promise<binding.File | null> {
    try {
      const device = isDesktop ? 'desktop' : 'mobile'
      const screenshotLink = this.constructScreenshotLink(testId)
      return await toFile(this.db, screenshotLink, `/www/screenshots/${urlToFilename(url)}/${device}/${generateHash()}.jpg`)
    } catch {
      return null
    }
  }

  /**
   * @param testId
   * @return
   */
  private constructScreenshotLink(testId: string): string {
    const year = testId.slice(0,2)
    const month = testId.slice(2,4)
    const day = testId.slice(4,6)
    const IdMatch = [...testId.matchAll(/_([^_]*)/g)]
    return `${credentials.wpt_dns}/results/${year}/${month}/${day}/${IdMatch[0][1]}/${IdMatch[1][1]}/1_screen.jpg`
  }

  /**
   * Builds the Speed Kit config to use for this test.
   */
  private async buildSpeedKitConfig(
    url: string,
    smartConfig: Config,
    ignoreConfig?: boolean,
    speedKitConfig?: string | null,
    speedKit?: string | null
  ): Promise<string> {
    // Has the user set a config as a test parameter?
    if (speedKitConfig) {
      return speedKitConfig
    }

    // Is Speed Kit enabled on the URL? Get its config
    this.db.log.info(`${url} has Speed Kit: ${speedKit !== null ? 'yes' : 'no'}`)
    if (speedKit && !ignoreConfig) {
      this.db.log.info(`Extracting config from URL: ${url}`)
      return speedKit
    }

    // Take smart config
    if (smartConfig) {
      return this.serializer.serialize(smartConfig, DataType.JAVASCRIPT)
    }

    throw new Error(`Config is missing for ${url}`)
  }

  /**
   * Creates a config analysis of the given URL.
   */
  private createConfigAnalysis(config: string, controllingSW: string | null): model.ConfigAnalysis | null {
    if (!config) {
      return null
    }

    const swMatch = config.match(/sw:([^,]*)/)
    const swUrl = swMatch ? swMatch[1].split('"')[1] : null

    const configAnalysis: model.ConfigAnalysis = new this.db.ConfigAnalysis()
    // If WPT has found Speed Kit there must be a config
    configAnalysis.configMissing = false
    configAnalysis.swPathMatches = swUrl && controllingSW ? controllingSW.includes(swUrl) : false;

    configAnalysis.swPath = swUrl
    configAnalysis.isDisabled = /disabled:[^,]*true/.test(config)

    return configAnalysis
  }

  /**
   * Creates a competitor test from params.
   */
  private createCompetitorTest(url: string, params: Required<TestParams>): Promise<model.TestResult> {
    return this.createTest(url, false, params)
  }

  /**
   * Creates a Speed Kit test from params.
   */
  private createSpeedKitTest(url: string, params: Required<TestParams>): Promise<model.TestResult> {
    return this.createTest(url, true, params)
  }

  /**
   * Creates a test from params.
   */
  private createTest(url: string, isClone: boolean, params: Required<TestParams>) {
    return this.testFactory.create(url, isClone, params)
  }
}
