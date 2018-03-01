/* eslint-disable comma-dangle, function-paren-newline */
/* eslint-disable no-restricted-syntax, no-param-reassign */
const { isRateLimited } = require('./rateLimiter');
const { queueTest, DEFAULT_ACTIVITY_TIMEOUT } = require('./queueTest');
const { getTLD } = require('./getSpeedKitUrl');
const { generateUniqueId } = require('./generateUniqueId');
const { callPageSpeed } = require('./callPageSpeed');
const { factorize } = require('./bulkTest');

function runComparison(db, params, callback = null) {
  return new Promise((resolve, reject) => createTestOverview(db, params)
    .then(testOverview => {
      //resolve(testOverview);

      const pageSpeedInsights = getPageSpeedInfo(db, testOverview, params);

      return Promise.all([
        startCompetitorTest(db, testOverview, params, callback),
        startSpeedKitTest(db, testOverview, params, callback)
      ])
      .then(([competitorTestResult, speedKitTestResult]) => {
        testOverview.competitorTestResult = competitorTestResult;
        testOverview.speedKitTestResult = speedKitTestResult;
        resolve(testOverview)
        return testOverview.ready().then(() => testOverview.save());
      });
    })
  );
}

function createTestOverview(db, params) {
  return generateUniqueId(db, 'TestOverview').then((uniqueId) => {
    const tld = getTLD(params.url);
    const testOverview = new db.TestOverview(Object.assign(params, {
      id: uniqueId + tld.substring(0, tld.length - 1),
      hasFinished: false,
      activityTimeout: params.activityTimeout || DEFAULT_ACTIVITY_TIMEOUT
    }));

    return testOverview.save();
  })
}

function getPageSpeedInfo(db, testOverview, { url, mobile}) {
  return callPageSpeed(url, mobile)
    .then(pageSpeedInsights => {
      testOverview.partialUpdate()
        .set('psiDomains', pageSpeedInsights.domains)
        .set('psiRequests', pageSpeedInsights.requests)
        .set('psiResponseSize', pageSpeedInsights.bytes)
        .set('psiScreenshot', pageSpeedInsights.screenshot)
        .execute();
      return pageSpeedInsights
    })
    .catch(error => {
      db.log.warn(`Could not call page speed`, { url, mobile, error: error.stack })
    });
}

function startCompetitorTest(db, testOverview, params, callback = null) {
  return queueTest(Object.assign({}, params, {
    db: db,
    speedKitConfig: null,
    skipPrewarm: null,
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
  }));
}

function startSpeedKitTest(db, testOverview, params, callback = null) {
  return queueTest(Object.assign({}, params, {
    db: db,
    isClone: true,
    finish: (testResult) => {
      testOverview.speedKitTestResult = testResult;
      testOverview.speedKitConfig = testResult.speedKitConfig;
      return checkComparisonState(db, testOverview, callback);
    }
  }));
}

function checkComparisonState(db, testOverview, onAfterFinish) {
  if (testOverview.competitorTestResult.hasFinished && testOverview.speedKitTestResult.hasFinished) {
    testOverview.hasFinished = true;
    testOverview.factors = calculateFactors(testOverview.competitorTestResult, testOverview.speedKitTestResult, db);
    if (onAfterFinish) {
      onAfterFinish(testOverview);
    }
  }
  return testOverview.ready().then(() => testOverview.save());
}

function calculateFactors(compResult, skResult, db) {
  if (skResult.testDataMissing || compResult.testDataMissing || !compResult.firstView || ! skResult.firstView) {
    return null;
  }

  return factorize(db, compResult.firstView, skResult.firstView);
}

exports.post = (db, req, res) => {
  // Check if IP is rate-limited
  if (isRateLimited(req)) {
    throw new Abort({ message: 'Too many requests', status: 429 });
  }
  return runComparison(db, req.body).then(testOverview => res.send(testOverview));
};

exports.runComparison = runComparison;
