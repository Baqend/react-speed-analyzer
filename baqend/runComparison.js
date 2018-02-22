/* eslint-disable comma-dangle, function-paren-newline */
/* eslint-disable no-restricted-syntax, no-param-reassign */

const { isRateLimited } = require('./rateLimiter');
const { queueTest, DEFAULT_ACTIVITY_TIMEOUT } = require('./queueTest');
const { getTLD } = require('./getSpeedKitUrl');
const { generateUniqueId } = require('./generateUniqueId');
const { callPageSpeed } = require('./callPageSpeed');

/**
 * @param db The Baqend instance.
 * @param subject A test overview to finish.
 */

function checkComparisonState(db, testOverview, onAfterFinish) {
  if (testOverview.competitorTestResult.hasFinished && testOverview.speedKitTestResult.hasFinished) {
    testOverview.hasFinished = true;
    if (onAfterFinish) {
      onAfterFinish(testOverview);
    }
  }
  return testOverview.ready().then(() => testOverview.save());
}

function runComparison(db, {
  bulkTest,
  location,
  caching,
  url,
  activityTimeout,
  speedKitConfig,
  isSpeedKitComparison,
  speedKitVersion,
  whitelist,
  mobile,
  priority,
  skipPrewarm
}, callback = null) {
  return new Promise((resolve, reject) => {
    const testOverview = new db.TestOverview();
    return generateUniqueId(db, 'TestOverview').then((uniqueId) => {
      const tld = getTLD(url);
      testOverview.id = uniqueId + tld.substring(0, tld.length - 1);
      testOverview.location = location;
      testOverview.url = url;
      testOverview.whitelist = whitelist;
      testOverview.caching = caching;
      testOverview.mobile = mobile;
      testOverview.hasFinished = false;
      testOverview.speedKitConfig = speedKitConfig;
      testOverview.isSpeedKitComparison = isSpeedKitComparison;
      testOverview.speedKitVersion = speedKitVersion;
      testOverview.activityTimeout = activityTimeout || DEFAULT_ACTIVITY_TIMEOUT;

      return testOverview.save();
    }).then((testOverview) => {
      resolve(testOverview);

      callPageSpeed(url, mobile).then(pageSpeedInsightsResult => testOverview.partialUpdate()
        .set('psiDomains', pageSpeedInsightsResult.domains)
        .set('psiRequests', pageSpeedInsightsResult.requests)
        .set('psiResponseSize', pageSpeedInsightsResult.bytes)
        .set('psiScreenshot', pageSpeedInsightsResult.screenshot)
        .execute()
      );

      const competitorTestRun = queueTest({
        db,
        location,
        caching,
        url,
        activityTimeout,
        priority,
        isSpeedKitComparison,
        mobile,
        isClone: false,
        finish: (testResult) => {
          testOverview.competitorTestResult = testResult;
          // if (testResult.testDataMissing !== true && testResult.firstView) {
          //   testOverview.psiDomains = testResult.firstView.domains.length;
          //   testOverview.psiRequests = testResult.firstView.requests;
          //   testOverview.psiResponseSize = testResult.firstView.bytes;
          // }
          return checkComparisonState(db, testOverview, callback);
        }
      });

      const speedKitTestRun = queueTest({
        db,
        location,
        caching,
        url,
        activityTimeout,
        priority,
        isSpeedKitComparison,
        mobile,
        speedKitConfig,
        skipPrewarm,
        isClone: true,
        finish: (testResult) => {
          testOverview.speedKitTestResult = testResult;
          testOverview.speedKitConfig = testResult.speedKitConfig;
          return checkComparisonState(db, testOverview, callback);
        }
      });

      return Promise.all([competitorTestRun, speedKitTestRun])
        .then(([competitorTestResult, speedKitTestResult]) => {
          testOverview.competitorTestResult = competitorTestResult;
          testOverview.speedKitTestResult = speedKitTestResult;
          return testOverview.ready().then(() => testOverview.save());
        });
    });
  });
}

exports.post = (db, req, res) => {
  // Check if IP is rate-limited
  if (isRateLimited(req)) {
    throw new Abort({ message: 'Too many requests', status: 429 });
  }
  return runComparison(db, req.body).then(testOverview => res.send(testOverview));
};

exports.runComparison = runComparison;
