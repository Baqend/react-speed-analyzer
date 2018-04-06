import stringifyObject from 'stringify-object'
import { baqend, model } from 'baqend'
import { getCachedSpeedKitConfig } from './configCaching'
import { getRootPath, getTLD } from './getSpeedKitUrl'
import { generateUniqueId } from './generateUniqueId'
import { analyzeSpeedKit } from './analyzeSpeedKit'
import { timeout } from './sleep'
import { DEFAULT_ACTIVITY_TIMEOUT, TestRequest } from './TestRequest'
import { AnalyzerRequest } from './AnalyzerRequest'

/**
 * Request which creates a TestOverview object and the TestResult objects that are processed
 * by the {@link ComparisonWorker} and the {@link TestWorker}.
 */
export class ComparisonRequest implements AnalyzerRequest<model.TestOverview> {
  private existingSpeedKitConfig: string | null
  private configAnalysis: model.ConfigAnalysis | null

  constructor(private db: baqend, private params: any) {
    this.existingSpeedKitConfig = null
    this.configAnalysis = null
  }

  async create(): Promise<model.TestOverview> {
    const existingSpeedKitConfig = await this.getExistingSpeedKitConfigForUrl()
    this.existingSpeedKitConfig = existingSpeedKitConfig
    if (this.params.isSpeedKitComparison) {
      this.configAnalysis = this.getConfigAnalysis(this.params.speedKitConfig || existingSpeedKitConfig)
    }

    const competitorTest = this.createCompetitorTest()
    const speedKitTest = this.createSpeedKitTest()

    const [competitorTestResult, speedKitTestResult] = await Promise.all([competitorTest, speedKitTest])

    return this.createTestOverview(competitorTestResult, speedKitTestResult)
  }

  private getExistingSpeedKitConfigForUrl(): Promise<string | null> {
    const { url, mobile, isSpeedKitComparison } = this.params
    if (isSpeedKitComparison) {
      this.db.log.info(`Extracting config from Website: ${url}`, { url, isSpeedKitComparison })
      const analyze = analyzeSpeedKit(url, this.db).then(it => stringifyObject(it.config))
        .catch(error => {
          this.db.log.warn(`Could not analyze speed kit config`, { url, error: error.stack })
          return null
        })

      return timeout(5000, analyze, null)
    }
    // return Promise.resolve(null)
    return getCachedSpeedKitConfig(this.db, url, mobile)
  }

  private getConfigAnalysis(config: string | null): model.ConfigAnalysis {
    const configAnalysis = new this.db.ConfigAnalysis()
    configAnalysis.isSecured = this.params.isSecured === true
    configAnalysis.swPath = this.params.swUrl

    if (!config) {
      configAnalysis.configMissing = true
      return configAnalysis
    }

    // FIXME: Do we really need to use `eval` here?
    const configObj = eval(`(${config})`)
    const rootPath = getRootPath(this.db, this.params.url)

    configAnalysis.swPathMatches = configObj.sw || rootPath + '/sw.js' === this.params.swUrl
    configAnalysis.isDisabled = configObj.disabled === true

    return configAnalysis
  }

  private async createTestOverview(competitorTest: model.TestResult, speedKitTest: model.TestResult): Promise<model.TestOverview> {
    const attributes: Partial<model.TestOverview> = {
      url: this.params.url,
      caching: this.params.caching,
      location: this.params.location,
      mobile: this.params.mobile,
      activityTimeout: this.params.activityTimeout || DEFAULT_ACTIVITY_TIMEOUT,
      isSpeedKitComparison: this.params.isSpeedKitComparison,
      speedKitVersion: this.params.speedKitVersion,
      speedKitConfig: null,
      configAnalysis: this.configAnalysis,
      hasFinished: false,
      competitorTestResult: competitorTest,
      speedKitTestResult: speedKitTest,
      tasks: [],
    }

    const uniqueId = await generateUniqueId(this.db, 'TestOverview')
    const tld = getTLD(this.db, this.params.url)
    attributes.id = uniqueId + tld.substring(0, tld.length - 1)

    const testOverview = new this.db.TestOverview(attributes)

    return testOverview.save()
  }

  private createCompetitorTest(): Promise<model.TestResult> {
    const params = {
      isClone: false,
      url: this.params.url,
      location: this.params.location,
      caching: this.params.caching,
      mobile: this.params.mobile,
      activityTimeout: this.params.activityTimeout,
      isSpeedKitComparison: this.params.isSpeedKitComparison,
      speedKitConfig: this.params.isSpeedKitComparison ? this.existingSpeedKitConfig : null,
      priority: this.params.priority,
      isWordPress: this.params.type === 'wordpress',
    }
    const competitorTest = new TestRequest(this.db, params)
    return competitorTest.create()
  }

  private createSpeedKitTest(): Promise<model.TestResult> {
    const params = {
      isClone: true,
      url: this.params.url,
      location: this.params.location,
      caching: this.params.caching,
      mobile: this.params.mobile,
      activityTimeout: this.params.activityTimeout,
      isSpeedKitComparison: this.params.isSpeedKitComparison,
      speedKitConfig: this.params.speedKitConfig || this.existingSpeedKitConfig,
      priority: this.params.priority,
      skipPrewarm: false,
      isWordPress: this.params.type === 'wordpress',
    }
    const speedKitTest = new TestRequest(this.db, params)
    return speedKitTest.create()
  }
}
