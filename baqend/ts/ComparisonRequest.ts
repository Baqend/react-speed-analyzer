import stringifyObject from 'stringify-object'
import { baqend, model } from 'baqend'
import { getTLD, getRootPath } from './getSpeedKitUrl'
import { generateUniqueId } from './generateUniqueId'
import { analyzeSpeedKit } from './analyzeSpeedKit'
import { sleep, timeout } from './sleep'
import { TestRequest } from './TestRequest'

const DEFAULT_ACTIVITY_TIMEOUT = 75

/**
 * Creates a TestOverview object and the TestResult objects that are processed by the ComparisonWorker
 * and the TestWorker
 */
export class ComparisonRequest {
  private existingSpeedKitConfig: null
  private configAnalysis: model.ConfigAnalysis | null

  constructor(private db: baqend, private params: any) {
    this.existingSpeedKitConfig = null
    this.configAnalysis = null
  }

  create() {
    return this.getExistingSpeedKitConfigForUrl().then(existingSpeedKitConfig => {
      this.existingSpeedKitConfig = existingSpeedKitConfig
      if (this.params.isSpeedKitComparison) {
        this.configAnalysis = this.getConfigAnalysis(this.params.speedKitConfig || existingSpeedKitConfig)
      }

      const competitorTest = this.createCompetitorTest()
      const speedKitTest = this.createSpeedKitTest()

      return Promise.all([competitorTest, speedKitTest]).then(tests => {
        return this.createTestOverview(tests)
      })
    })
  }

  getConfigAnalysis(config): model.ConfigAnalysis {
    const configAnalysis = new this.db.ConfigAnalysis()
    configAnalysis.isSecured = this.params.isSecured === true
    configAnalysis.swPath = this.params.swUrl

    if (!config) {
      configAnalysis.configMissing = true
      return configAnalysis
    }

    const configObj = eval(`(${config})`)
    const rootPath = getRootPath(this.db, this.params.url)

    configAnalysis.swPathMatches = configObj.sw || rootPath + '/sw.js' === this.params.swUrl
    configAnalysis.isDisabled = configObj.disabled === true

    return configAnalysis
  }

  getCachedSpeedKitConfig(): Promise<string | null> {
    const date = new Date()
    const { url, mobile } = this.params
    return this.db.CachedConfig.find()
      .equal('url', url)
      .equal('mobile', mobile)
      .greaterThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60 * 60))
      .singleResult()
      .then(cachedConfig => {
        if (cachedConfig && cachedConfig.config) {
          this.db.log.info(`Use cached config`, { url, cachedConfig })
          return cachedConfig.config
        }
        return null
      })
  }

  getExistingSpeedKitConfigForUrl() {
    const { url, isSpeedKitComparison } = this.params
    if (isSpeedKitComparison) {
      this.db.log.info(`Extracting config from Website: ${url}`, {url, isSpeedKitComparison})
      const analyze = analyzeSpeedKit(url, this.db).then(it => stringifyObject(it.config))
        .catch(error => {
          this.db.log.warn(`Could not analyze speed kit config`, {url, error: error.stack})
          return null
        })

      return timeout(5000, analyze, null)
    }
    // return Promise.resolve(null)
    return this.getCachedSpeedKitConfig()
  }


  createTestOverview([competitorTest, speedKitTest]) {
    const attributes = {
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
      id: null
    }

    return generateUniqueId(this.db, 'TestOverview')
      .then(uniqueId => {
        if (uniqueId) {
          const tld = getTLD(this.db, this.params.url)
          attributes.id = uniqueId + tld.substring(0, tld.length - 1)
        }
        const testOverview = new this.db.TestOverview(attributes)
        return testOverview.save()
      })
  }

  createCompetitorTest() {
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
    }
    const competitorTest = new TestRequest(this.db, params)
    return competitorTest.create()
  }

  createSpeedKitTest() {
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
    }
    const speedKitTest = new TestRequest(this.db, params)
    return speedKitTest.create()
  }
}
