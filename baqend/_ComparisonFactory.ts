import { baqend, model } from 'baqend'
import stringifyObject from 'stringify-object'
import { analyzeSpeedKit } from './_analyzeSpeedKit'
import { AsyncFactory } from './_AsyncFactory'
import { getCachedSpeedKitConfig } from './_configCaching'
import { getRootPath, getTLD } from './_getSpeedKitUrl'
import { timeout } from './_sleep'
import { DEFAULT_ACTIVITY_TIMEOUT, TestFactory, TestParams } from './_TestFactory'
import { generateUniqueId } from './generateUniqueId'

export interface ComparisonParams extends TestParams {
  swUrl: string
  isSecured: boolean
  type: string
  speedKitVersion: string
}

/**
 * Request which creates a TestOverview object and the TestResult objects that are processed
 * by the {@link ComparisonWorker} and the {@link TestWorker}.
 */
export class ComparisonFactory implements AsyncFactory<model.TestOverview> {
  constructor(private db: baqend, private testFactory: TestFactory) {
  }

  async create(params: ComparisonParams): Promise<model.TestOverview> {
    const existingSpeedKitConfig = await this.getExistingSpeedKitConfigForUrl(params)
    let configAnalysis = null
    if (params.isSpeedKitComparison) {
      configAnalysis = this.getConfigAnalysis(params.url, params.swUrl, params.speedKitConfig || existingSpeedKitConfig)
    }

    const competitorTest = this.createCompetitorTest(params, existingSpeedKitConfig)
    const speedKitTest = this.createSpeedKitTest(params, existingSpeedKitConfig)

    const [competitorTestResult, speedKitTestResult] = await Promise.all([competitorTest, speedKitTest])

    return this.createTestOverview(competitorTestResult, speedKitTestResult, params, configAnalysis)
  }

  private getExistingSpeedKitConfigForUrl({ url, mobile, isSpeedKitComparison }: ComparisonParams): Promise<string | null> {
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
    return getCachedSpeedKitConfig(this.db, url, mobile!)
  }

  private getConfigAnalysis(url: string, swUrl: string, config: string | null): model.ConfigAnalysis {
    const configAnalysis = new this.db.ConfigAnalysis()
    configAnalysis.swPath = swUrl

    if (!config) {
      configAnalysis.configMissing = true
      return configAnalysis
    }

    // FIXME: Do we really need to use `eval` here?
    const configObj = eval(`(${config})`)
    const rootPath = getRootPath(this.db, url)

    configAnalysis.swPathMatches = configObj.sw || rootPath + '/sw.js' === swUrl
    configAnalysis.isDisabled = configObj.disabled === true

    return configAnalysis
  }

  private async createTestOverview(competitorTest: model.TestResult, speedKitTest: model.TestResult, params: ComparisonParams, configAnalysis: model.ConfigAnalysis | null): Promise<model.TestOverview> {
    const attributes: Partial<model.TestOverview> = {
      url: params.url,
      caching: params.caching,
      location: params.location,
      mobile: params.mobile,
      activityTimeout: params.activityTimeout || DEFAULT_ACTIVITY_TIMEOUT,
      isSpeedKitComparison: params.isSpeedKitComparison,
      speedKitVersion: params.speedKitVersion,
      speedKitConfig: null,
      configAnalysis: configAnalysis,
      hasFinished: false,
      competitorTestResult: competitorTest,
      speedKitTestResult: speedKitTest,
      tasks: [],
      isSecured: params.isSecured === true,
    }

    const uniqueId = await generateUniqueId(this.db, 'TestOverview')
    const tld = getTLD(this.db, params.url)
    attributes.id = uniqueId + tld.substring(0, tld.length - 1)

    const testOverview = new this.db.TestOverview(attributes)

    return testOverview.save()
  }

  private createCompetitorTest(params: ComparisonParams, existingSpeedKitConfig: string | null): Promise<model.TestResult> {
    return this.createTest(params, false, params.isSpeedKitComparison ? existingSpeedKitConfig : null)
  }

  private createSpeedKitTest(params: ComparisonParams, existingSpeedKitConfig: string | null): Promise<model.TestResult> {
    return this.createTest(params, true, params.speedKitConfig || existingSpeedKitConfig)
  }

  /**
   * Creates a test from params.
   */
  private createTest(params: ComparisonParams, isClone: boolean, speedKitConfig: string | null): Promise<model.TestResult> {
    const testParams = {
      isClone,
      url: params.url,
      location: params.location,
      caching: params.caching,
      mobile: params.mobile,
      activityTimeout: params.activityTimeout,
      isSpeedKitComparison: params.isSpeedKitComparison,
      speedKitConfig,
      priority: params.priority,
      skipPrewarm: false,
      isWordPress: params.type === 'wordpress',
    }

    return this.testFactory.create(testParams)
  }
}
