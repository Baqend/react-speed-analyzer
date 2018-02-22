/* eslint-disable comma-dangle, function-paren-newline */
/* eslint-disable no-restricted-syntax, no-param-reassign */

const { aggregateFields } = require('./helpers');
const { queueTest, DEFAULT_LOCATION, DEFAULT_ACTIVITY_TIMEOUT } = require('./queueTest');
const { generateSpeedKitConfig, getTLD } = require('./getSpeedKitUrl');
const { generateUniqueId } = require('./generateUniqueId');
const { analyzeUrl } = require('./analyzeUrl');
const { callPageSpeed } = require('./callPageSpeed');

const fields = ['speedIndex', 'firstMeaningfulPaint', 'ttfb', 'domLoaded', 'fullyLoaded', 'lastVisualChange'];

/**
 * @param db The Baqend instance.
 * @param subject A test overview to finish.
 */

function checkComparisonState(db, testOverview, onAfterFinish) {
  if (testOverview.competitorTestResult.hasFinished && testOverview.speedKitTestResult.hasFinished) {
    testOverview.hasFinished = true;
    onAfterFinish && onAfterFinish(testOverview)
  }
  return testOverview.ready().then(() => testOverview.save())
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
    db.log.info("runComparison", {
      bulkTest, location, caching, url, activityTimeout, speedKitConfig, isSpeedKitComparison, speedKitVersion, whitelist, mobile, priority,
    })
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
      resolve(testOverview)

      callPageSpeed(url, mobile).then((pageSpeedInsightsResult) => {
        return testOverview.partialUpdate()
          .set('psiDomains', pageSpeedInsightsResult.domains)
          .set('psiRequests', pageSpeedInsightsResult.requests)
          .set('psiResponseSize', pageSpeedInsightsResult.bytes)
          .set('psiScreenshot', pageSpeedInsightsResult.screenshot)
          .execute()
      })

      db.log.info("runCompetitorTest", {
        location, caching, url, activityTimeout, priority, isSpeedKitComparison, mobile
      })
      const competitorTestRun = queueTest({
        db, location, caching, url, activityTimeout, priority, isSpeedKitComparison, mobile,
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
      })

      db.log.info("runSpeedKitTest", {
        location, caching, url, activityTimeout, priority, isSpeedKitComparison, mobile, speedKitConfig,
      })
      const speedKitTestRun = queueTest({
        db, location, caching, url, activityTimeout, priority, isSpeedKitComparison, mobile,
        speedKitConfig,
        isClone: true,
        skipPrewarm,
        finish: (testResult) => {
          testOverview.speedKitTestResult = testResult;
          testOverview.speedKitConfig = testResult.speedKitConfig;
          return checkComparisonState(db, testOverview, callback);
        }
      })

      return Promise.all([ competitorTestRun, speedKitTestRun ])
        .then(([ competitorTestResult, speedKitTestResult ]) => {
          testOverview.competitorTestResult = competitorTestResult;
          testOverview.speedKitTestResult = speedKitTestResult;
          return testOverview.ready().then(() => testOverview.save());
        });
    })

  })
}

exports.post = (db, req, res) => {
  const { body } = req;
  return runComparison(db, body).then(testOverview => res.send(testOverview));
};

exports.runComparison = runComparison;
