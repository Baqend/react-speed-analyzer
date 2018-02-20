/* eslint-disable comma-dangle, function-paren-newline */
/* eslint-disable no-restricted-syntax, no-param-reassign */

const { aggregateFields } = require('./helpers');
const { queueTest, DEFAULT_LOCATION, DEFAULT_ACTIVITY_TIMEOUT } = require('./queueTest');
const { generateSpeedKitConfig, getTLD } = require('./getSpeedKitUrl');
const { generateUniqueId } = require('./generateUniqueId');
const { analyzeUrl } = require('./analyzeUrl');

const fields = ['speedIndex', 'firstMeaningfulPaint', 'ttfb', 'domLoaded', 'fullyLoaded', 'lastVisualChange'];

/**
 * Calculates the factors of two mean test result values.
 *
 * @param db The Baqend instance.
 * @param competitor The competitor's result.
 * @param speedKit The result of Speed Kit.
 * @return A mean containing the factors.
 */
function factorize(db, competitor, speedKit) {
  const result = new db.Mean();
  for (const field of fields) {
    result[field] = competitor[field] / speedKit[field];
  }

  return result;
}

/**
 * Gets the best result for a given field of the competitor or Speed Kit.
 *
 * @param bulkTest A bulk test to analyze.
 * @param {'competitor' | 'speedKit'} resultFieldPrefix Either 'competitor' or 'speedKit'.
 * @param {string} field The field to get the best result of.
 * @return {number} Returns the result or NaN, if no result exists.
 */
function bestResult(bulkTest, resultFieldPrefix, field) {
  const resultField = `${resultFieldPrefix}TestResult`;
  const best = bulkTest.testOverviews.reduce((prev, { [resultField]: result }) => {
    if (result.firstView) {
      return Math.min(prev, result.firstView[field]);
    }

    return prev;
  }, Infinity);

  return Number.isFinite(best) ? best : NaN;
}

/**
 * Gets the worst result for a given field of the competitor or Speed Kit.
 *
 * @param bulkTest A bulk test to analyze.
 * @param {'competitor' | 'speedKit'} resultFieldPrefix Either 'competitor' or 'speedKit'.
 * @param {string} field The field to get the worst result of.
 * @return {number} Returns the result or NaN, if no result exists.
 */
function worstResult(bulkTest, resultFieldPrefix, field) {
  const resultField = `${resultFieldPrefix}TestResult`;
  const worst = bulkTest.testOverviews.reduce((prev, { [resultField]: result }) => {
    if (result.firstView) {
      return Math.max(prev, result.firstView[field]);
    }

    return prev;
  }, -1);

  return worst === -1 ? NaN : worst;
}

/**
 * Calculates the best factors for a given bulk test.
 *
 * @param db The Baqend instance.
 * @param bulkTest A bulk test to analyze.
 * @return {object} The values of the best factor.
 */
function calcBestFactors(db, bulkTest) {
  const result = new db.Mean();
  for (const field of fields) {
    const competitorWorst = worstResult(bulkTest, 'competitor', field);
    const speedKitBest = bestResult(bulkTest, 'speedKit', field);

    result[field] = (competitorWorst / speedKitBest) || null;
  }

  return result;
}

/**
 * Calculates the worst factors for a given bulk test.
 *
 * @param db The Baqend instance.
 * @param bulkTest A bulk test to analyze.
 * @return {object} The values of the worst factor.
 */
function calcWorstFactors(db, bulkTest) {
  const result = new db.Mean();
  for (const field of fields) {
    const competitorBest = bestResult(bulkTest, 'competitor', field);
    const speedKitWorst = worstResult(bulkTest, 'speedKit', field);

    result[field] = (competitorBest / speedKitWorst) || null;
  }

  return result;
}

/**
 * Checks whether a test overview is finished.
 */
function hasTestOverviewFinished({ competitorTestResult, speedKitTestResult }) {
  return competitorTestResult.hasFinished === true && speedKitTestResult.hasFinished === true;
}

/**
 * Returns whether a bulk test has finished.
 */
function hasBulkTestFinished(bulkTest) {
  return bulkTest.testOverviews.every(it => hasTestOverviewFinished(it));
}

/**
 * Picks the test results with a given name from a bulk test.
 */
function pickResults(bulkTest, name) {
  const field = `${name}TestResult`;
  return bulkTest.testOverviews.map(overview => overview[field] && overview[field].firstView).filter(it => !!it);
}

/**
 * @param db The Baqend instance.
 * @param subject A test overview to finish.
 */
function finishTestOverview(db, subject) {
  const testOverview = subject;
  const { competitorTestResult, speedKitTestResult } = subject;
  testOverview.hasFinished = true;
  if (competitorTestResult.firstView && speedKitTestResult.firstView) {
    testOverview.factors = factorize(db, competitorTestResult.firstView, speedKitTestResult.firstView);
  }
}

/**
 * Updates aggregates on a bulk test.
 */
function updateBulkTest(db, bulkTestRef) {
  const bulkTest = bulkTestRef;
  // We must not use the refresh option because we have the same db object when updating test results.
  return bulkTest.load({ depth: 2 }).then(() => {
    bulkTest.hasFinished = hasBulkTestFinished(bulkTest);
    bulkTest.speedKitMeanValues = new db.Mean(aggregateFields(pickResults(bulkTest, 'speedKit'), fields));
    bulkTest.competitorMeanValues = new db.Mean(aggregateFields(pickResults(bulkTest, 'competitor'), fields));
    bulkTest.factors = factorize(db, bulkTest.competitorMeanValues, bulkTest.speedKitMeanValues);
    bulkTest.bestFactors = calcBestFactors(db, bulkTest);
    bulkTest.worstFactors = calcWorstFactors(db, bulkTest);

    return bulkTest.save();
  }).catch((e) => {
    db.log.error('Error while computing bulk test aggregate.', e);

    return bulkTest;
  });
}

function createTestOverview(db, {
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
}) {
  const testOverview = new db.TestOverview();

  return generateUniqueId(db, 'TestOverview').then((uniqueId) => {
    const tld = getTLD(url);
    testOverview.id = uniqueId + tld.substring(0, tld.length - 1);
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
  }).then(() => Promise.all([
    // Queue the test against the competitor's site
    queueTest({
      db,
      location,
      caching,
      url,
      activityTimeout,
      priority,
      isSpeedKitComparison,
      mobile,
      isClone: false,
      finish(testResult) {
        testOverview.competitorTestResult = testResult;
        if (testResult.testDataMissing !== true && testResult.firstView) {
          testOverview.psiDomains = testResult.firstView.domains.length;
          testOverview.psiRequests = testResult.firstView.requests;
          testOverview.psiResponseSize = testResult.firstView.bytes;
        }

        if (testOverview.competitorTestResult.hasFinished && testOverview.speedKitTestResult.hasFinished) {
          finishTestOverview(db, testOverview);
          bulkTest.completedRuns += 1;
        }

        testOverview.ready()
          .then(() => testOverview.save())
          .then(() => updateBulkTest(db, bulkTest));
      },
    }),

    // Queue the test against Speed Kit
    queueTest({
      db,
      location,
      caching,
      url,
      activityTimeout,
      isSpeedKitComparison,
      speedKitConfig,
      priority,
      mobile,
      isClone: true,
      finish(testResult) {
        testOverview.speedKitTestResult = testResult;

        if (testOverview.speedKitTestResult.hasFinished && testOverview.competitorTestResult.hasFinished) {
          finishTestOverview(db, testOverview);
          bulkTest.completedRuns += 1;
        }

        testOverview.ready()
          .then(() => testOverview.save())
          .then(() => updateBulkTest(db, bulkTest));
      },
    }),
  ])
  ).then(([competitor, speedKit]) => {
    testOverview.competitorTestResult = competitor;
    testOverview.speedKitTestResult = speedKit;
    return testOverview.ready().then(() => testOverview.save());
  });
}

/**
 * @param db The Baqend instance.
 * @param {object} options
 * @return {Promise}
 */
function createTestOverviews(db, options) {
  const { runs } = options;
  const promises = new Array(runs)
    .fill(null)
    .map(() => createTestOverview(db, options));

  return Promise.all(promises);
}

/**
 * @param db The Baqend instance.
 * @param {string | null} createdBy A reference to the user who created the bulk test.
 * @param {string} url The URL under test.
 * @param {string} whitelist A whitelist to use for the test.
 * @param {boolean} speedKitConfig Configuration for the speed kit snippet.
 * @param {number} [activityTimeout] The timeout when the test should be aborted.
 * @param {string} [location] The server location to execute the test.
 * @param {number} [runs] The number of runs to execute.
 * @param {boolean} [caching] If true, browser caching will be used. Defaults to false.
 * @param {boolean} [mobile] If true, mobile version will be tested. Defaults to false.
 * @param {number} [priority=9] Defines the test's priority, from 0 (highest) to 9 (lowest).
 * @return {Promise} An object containing bulk test information
 */
function createBulkTest(db, createdBy, {
  url,
  whitelist,
  speedKitConfig,
  activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
  runs = 1,
  caching = false,
  location = DEFAULT_LOCATION,
  mobile = false,
  priority = 9,
}) {
  const bulkTest = new db.BulkTest();
  bulkTest.url = url;
  bulkTest.createdBy = createdBy;
  bulkTest.hasFinished = false;
  bulkTest.location = location;
  bulkTest.mobile = mobile;
  bulkTest.runs = runs;
  bulkTest.priority = priority;
  bulkTest.completedRuns = 0;

  return bulkTest.save()
    .then(() => analyzeUrl(url, db))
    .then((urlAnalysis) => {
      bulkTest.urlAnalysis = urlAnalysis && new db.UrlAnalysis(urlAnalysis);

      return bulkTest.save();
    })
    .then(() => {
      const urlTo = bulkTest.urlAnalysis ? bulkTest.urlAnalysis.url : url;

      return speedKitConfig || generateSpeedKitConfig(urlTo, whitelist, mobile);
    })
    .then(config => createTestOverviews(db, {
      bulkTest,
      whitelist,
      activityTimeout,
      runs,
      caching,
      location,
      mobile,
      priority,
      speedKitConfig: config,
      url: bulkTest.urlAnalysis ? bulkTest.urlAnalysis.url : url,
      isSpeedKitComparison: bulkTest.urlAnalysis ? bulkTest.urlAnalysis.enabled : false,
      speedKitVersion: bulkTest.urlAnalysis ? bulkTest.urlAnalysis.version : null,
    }))
    .then((overviews) => {
      bulkTest.testOverviews = overviews;

      return bulkTest.save();
    });
}

exports.post = function bulkTestPost(db, req, res) {
  const { body } = req;
  const { createdBy = null } = body;
  let { tests } = body;
  if (body instanceof Array) {
    tests = body;
  }

  return Promise.all(tests.map(entry => createBulkTest(db, createdBy, entry)))
    .then(results => res.send(results));
};

exports.createBulkTest = createBulkTest;
