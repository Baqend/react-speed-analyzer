const { aggregateFields } = require('./helpers');

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
 * Updates aggregates on a bulk test.
 */
function updateBulkTest(db, bulkTestRef) {
  const bulkTest = bulkTestRef;
  // We must not use the refresh option because we have the same db object when updating test results.
  return bulkTest.load({ depth: 2 }).then(() => {
    bulkTest.hasFinished = bulkTest.testOverviews.length === bulkTest.runs ? hasBulkTestFinished(bulkTest) : false;
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

exports.updateBulkTest = updateBulkTest;
exports.factorize = factorize;
