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
  constructor(db, testRequestHandler, params) {
    this.db = db
    this.testRequestHandler = testRequestHandler
    this.params = params
    this.existingSpeedKitConfig = null
  }

  handleRequest() {
    return this.getExistingSpeedKitConfigForUrl().then(existingSpeedKitConfig => {
      this.existingSpeedKitConfig = existingSpeedKitConfig

      const competitorTest = this.createCompetitorTest(),
      const speedKitTest = this.createSpeedKitTest()

      return Promise.all([competitorTest, speedKitTest]).then(tests => {
        return this.createTestOverview(tests)
      })
    })
  }

  getExistingSpeedKitConfigForUrl() {
    const { url, isSpeedKitComparison } = this.params
    if (isSpeedKitComparison) {
      db.log.info(`Extracting config from Website: ${url}`, {url, isSpeedKitComparison});
      return analyzeSpeedKit(url, db)
        .then(it => stringifyObject(it.config))
        .catch(error => {
          db.log.warn(`Could not analyze speed kit config`, {url, error: error.stack});
          return null
        });
    }
    return Promise.resolve(null);
  }

  createTestOverview([competitorTest, speedKitTest]) {
    return generateUniqueId(this.db, 'TestOverview')
      .then(uniqueId => {
        const tld = getTLD(params.url);
        const testOverview = new db.TestOverview(Object.assign(params, {
          id: uniqueId + tld.substring(0, tld.length - 1),
          url: this.params.url,
          caching: this.params.caching,
          location: this.params.location,
          mobile: this.params.mobile,
          activityTimeout: this.params.activityTimeout || DEFAULT_ACTIVITY_TIMEOUT
          isSpeedKitComparison: this.params.isSpeedKitComparison,
          speedKitVersion: this.params.speedKitVersion,
          speedKitConfig: null,
          hasFinished: false,
          competitorTestResult: competitorTest,
          speedKitTestResult: speedKitTest,
        }));
        return testOverview.save();
      })
  }

  createCompetitorTest() {
    return this.testRequestHandler.handleTestRequest({
      isClone: false,
      url: this.params.url,
      location: this.params.location
      caching: this.params.caching,
      mobile: this.params.mobile,
      activityTimeout: this.params.activityTimeout,
      isSpeedKitComparison: this.params.isSpeedKitComparison,
      speedKitConfig: this.existingSpeedKitConfig,
      priority: this.params.priority,
    });
  }

  handleTestRequest(db, params) {
    return this.testRequestHandler.handleTestRequest({
      isClone: true,
      url: this.params.url,
      location: this.params.location
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

const { TestRequestHandler } = require('./_testResultHandler')

exports.post = (db, req, res) => {
  // Check if IP is rate-limited
  if (isRateLimited(req)) {
    throw new Abort({ message: 'Too many requests', status: 429 });
  }
  const params = req.body
  const testRequestHandler = new TestRequestHandler(db)
  const comparisonRequestHandler = new ComparisonRequestHandler(db, testRequestHandler, params)

  return comparisonRequestHandler.handleRequest().then(testOverview => res.send(testOverview))
};

exports.runComparison = runComparison;
