/* eslint-disable comma-dangle, function-paren-newline */
/* eslint-disable no-restricted-syntax, no-param-reassign */
const { isRateLimited } = require('./rateLimiter');
const { queueTest, DEFAULT_ACTIVITY_TIMEOUT } = require('./queueTest');
const { getTLD } = require('./getSpeedKitUrl');
const { generateUniqueId } = require('./generateUniqueId');
const { callPageSpeed } = require('./callPageSpeed');
const { factorize } = require('./updateBulkComparison');

const { analyzeSpeedKit } = require('./analyzeSpeedKit');

class ComparisonRequestHandler {
  constructor(db, testWorker, params) {
    this.db = db
    this.testWorker = testWorker
    this.params = params
    this.existingSpeedKitConfig = null
  }

  handleRequest() {
    return this.getExistingSpeedKitConfigForUrl().then(existingSpeedKitConfig => {
      this.existingSpeedKitConfig = existingSpeedKitConfig

      const competitorTest = this.createCompetitorTest()
      const speedKitTest = this.createSpeedKitTest()

      return Promise.all([competitorTest, speedKitTest]).then(tests => {
        return this.createTestOverview(tests)
      })
    })
  }

  getExistingSpeedKitConfigForUrl() {
    const { url, isSpeedKitComparison } = this.params
    if (isSpeedKitComparison) {
      this.db.log.info(`Extracting config from Website: ${url}`, {url, isSpeedKitComparison});
      return analyzeSpeedKit(url, this.db)
        .then(it => stringifyObject(it.config))
        .catch(error => {
          this.db.log.warn(`Could not analyze speed kit config`, {url, error: error.stack});
          return null
        });
    }
    return Promise.resolve(null);
  }

  createTestOverview([competitorTest, speedKitTest]) {
    return generateUniqueId(this.db, 'TestOverview')
      .then(uniqueId => {
        const tld = getTLD(this.db, this.params.url);
        const testOverview = new this.db.TestOverview({
          id: uniqueId + tld.substring(0, tld.length - 1),
          url: this.params.url,
          caching: this.params.caching,
          location: this.params.location,
          mobile: this.params.mobile,
          activityTimeout: this.params.activityTimeout || DEFAULT_ACTIVITY_TIMEOUT,
          isSpeedKitComparison: this.params.isSpeedKitComparison,
          speedKitVersion: this.params.speedKitVersion,
          speedKitConfig: null,
          hasFinished: false,
          competitorTestResult: competitorTest,
          speedKitTestResult: speedKitTest,
        });
        return testOverview.save();
      })
  }

  createCompetitorTest() {
    return this.testWorker.handleTestRequest({
      isClone: false,
      url: this.params.url,
      location: this.params.location,
      caching: this.params.caching,
      mobile: this.params.mobile,
      activityTimeout: this.params.activityTimeout,
      isSpeedKitComparison: this.params.isSpeedKitComparison,
      speedKitConfig: this.existingSpeedKitConfig,
      priority: this.params.priority,
    });
  }

  createSpeedKitTest() {
    return this.testWorker.handleTestRequest({
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
    });
  }
}

exports.ComparisonRequestHandler = ComparisonRequestHandler

const { TestWorker } = require('./_testWorker')
const { TestRequestHandler } = require('./_testRequestHandler')
const { TestResultHandler } = require('./_testResultHandler')

exports.post = (db, req, res) => {
  // Check if IP is rate-limited
  if (isRateLimited(req)) {
    throw new Abort({ message: 'Too many requests', status: 429 });
  }
  const params = req.body

  const testRequestHandler = new TestRequestHandler(db)
  const testResultHandler = new TestResultHandler(db)
  const testWorker = new TestWorker({ db, testResultHandler, testResultHandler })

  const comparisonRequestHandler = new ComparisonRequestHandler({ db, testWorker, params })

  return comparisonRequestHandler.handleRequest().then(testOverview => res.send(testOverview))
};
