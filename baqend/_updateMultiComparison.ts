import { baqend, model } from 'baqend'
import { aggregateFields, meanValue } from './_helpers'
import { ComparisonFactory } from './_ComparisonFactory';
import { setSuccess } from "./_Status";

type TestResultFieldPrefix = 'competitor' | 'speedKit'

const fields: Array<keyof model.Mean> = ['speedIndex', 'firstMeaningfulPaint', 'ttfb', 'domLoaded', 'fullyLoaded', 'lastVisualChange', 'load', 'largestContentfulPaint']

/**
 * Calculates the factors of two mean test result values.
 *
 * @param db The Baqend instance.
 * @param competitor The competitor's result.
 * @param speedKit The result of Speed Kit.
 * @return A mean containing the factors.
 */
export function factorize(db: baqend, competitor: model.Mean, speedKit: model.Mean): model.Mean {
  const result = new db.Mean()
  for (const field of fields) {
    const competitorElement = competitor[field] as number
    const speedKitElement = speedKit[field] as number

    result[field] = competitorElement / speedKitElement
  }

  return result
}

/**
 * Calculates the factors of a bulk test.
 *
 * @param db The Baqend instance.
 * @param bulkTest The bulk test to calculate the factors for.
 * @return A mean containing the factors.
 */
export function aggregateBulkTestFactors(db: baqend, bulkTest: model.BulkTest): model.Mean {
  const result = {} as { [key: string]: number[] }
  for (const testOverview of bulkTest.testOverviews) {
    if (testOverview.factors) {
      for (const field of fields) {
        const value = testOverview.factors[field] as number
        result[field] = result[field] || []
        result[field].push(value)
      }
    }
  }

  const mean = new db.Mean()
  for (const [field, values] of Object.entries(result)) {
    mean[field] = meanValue(values)
  }

  return mean
}

/**
 * @param bulkTest The Bulk Test to iterate
 * @param prefix Either 'competitor' or 'speedKit'.
 * @return Returns the test results.
 */
function iterateTestResultsInBulkTest(bulkTest: model.BulkTest, prefix: TestResultFieldPrefix): model.TestResult[] {
  return bulkTest.testOverviews.map(comparison => prefix === 'speedKit' ? comparison.speedKitTestResult : comparison.competitorTestResult)
}

/**
 * Gets the best result for a given field of the competitor or Speed Kit.
 *
 * @param bulkTest A bulk test to analyze.
 * @param prefix Either 'competitor' or 'speedKit'.
 * @param field The field to get the best result of.
 * @return Returns the result or NaN, if no result exists.
 */
function bestResult(bulkTest: model.BulkTest, prefix: TestResultFieldPrefix, field: string): number {
  const best = iterateTestResultsInBulkTest(bulkTest, prefix).reduce((prev, result) => {
    if (result.firstView) {
      return Math.min(prev, (result.firstView as any)[field])
    }

    return prev
  }, Infinity)

  return Number.isFinite(best) ? best : NaN
}

/**
 * Gets the worst result for a given field of the competitor or Speed Kit.
 *
 * @param bulkTest A bulk test to analyze.
 * @param prefix Either 'competitor' or 'speedKit'.
 * @param field The field to get the worst result of.
 * @return Returns the result or NaN, if no result exists.
 */
function worstResult(bulkTest: model.BulkTest, prefix: TestResultFieldPrefix, field: string): number {
  const worst = iterateTestResultsInBulkTest(bulkTest, prefix).reduce((prev, result) => {
    if (result.firstView) {
      return Math.max(prev, (result.firstView as any)[field])
    }

    return prev
  }, -1)

  return worst === -1 ? NaN : worst
}

/**
 * Calculates the best factors for a given bulk test.
 *
 * @param db The Baqend instance.
 * @param bulkTest A bulk test to analyze.
 * @return The values of the best factor.
 */
function calcBestFactors(db: baqend, bulkTest: model.BulkTest): model.Mean {
  const result = new db.Mean()
  for (const field of fields) {
    const competitorWorst = worstResult(bulkTest, 'competitor', field as string)
    const speedKitBest = bestResult(bulkTest, 'speedKit', field as string)

    result[field] = (competitorWorst / speedKitBest) || null
  }

  return result
}

/**
 * Calculates the worst factors for a given bulk test.
 *
 * @param db The Baqend instance.
 * @param bulkTest A bulk test to analyze.
 * @return {object} The values of the worst factor.
 */
function calcWorstFactors(db: baqend, bulkTest: model.BulkTest): model.Mean {
  const result = new db.Mean()
  for (const field of fields) {
    const competitorBest = bestResult(bulkTest, 'competitor', field as string)
    const speedKitWorst = worstResult(bulkTest, 'speedKit', field as string)

    result[field] = (competitorBest / speedKitWorst) || null
  }

  return result
}

/**
 * Picks the test results with a given name from a bulk test.
 */
function pickResults(bulkTest: model.BulkTest, prefix: TestResultFieldPrefix): model.Run[] {
  const field = `${prefix}TestResult` as keyof model.TestOverview

  return bulkTest.testOverviews
    .map(overview => overview[field] && (overview[field] as model.TestResult).firstView)
    .filter(it => !!it) as model.Run[]
}

/**
 * Updates aggregates on a bulk test.
 */
export async function updateMultiComparison(db: baqend, bulkTestRef: model.BulkTest): Promise<model.BulkTest> {
  const bulkTest = bulkTestRef

  try {
    // We must not use the refresh option because we have the same DB object when updating test results.
    await bulkTest.load({ depth: 2 })

    bulkTest.speedKitMeanValues = new db.Mean(aggregateFields(pickResults(bulkTest, 'speedKit'), fields))
    bulkTest.competitorMeanValues = new db.Mean(aggregateFields(pickResults(bulkTest, 'competitor'), fields))
    bulkTest.factors = aggregateBulkTestFactors(db, bulkTest)
    bulkTest.bestFactors = calcBestFactors(db, bulkTest)
    bulkTest.worstFactors = calcWorstFactors(db, bulkTest)
    bulkTest.completedRuns += 1

    return bulkTest.save()
  } catch (e) {
    db.log.error('Error while computing bulk test aggregate.', { error: e.stack });

    return bulkTest
  }
}

/**
 * Creates an optimized comparison if no existing comparison has a high factor.
 * @param {baqend} db - The Baqend instance.
 * @param {model.BulkTest} bulkTest - The bulk test to analyze.
 * @param {ComparisonFactory} comparisonFactory - Factory for creating comparisons.
 * @returns {Promise<model.TestOverview | null>} The optimized comparison or null.
 */
export async function createOptimizedComparison(
  db: baqend,
  bulkTest: model.BulkTest,
  comparisonFactory: ComparisonFactory
): Promise<model.TestOverview | null> {
  const mainFactor = bulkTest.params.mainFactor || 'largestContentfulPaint';
  const threshold = 2;

  const hasHighFactor = bulkTest.testOverviews.some(
    (comparison) => comparison.factors?.[mainFactor] > threshold
  );

  if (hasHighFactor) {
    return null;
  }

  const [speedKitTestResult, competitorTestResult] = findOptimalTestResults(bulkTest, mainFactor, threshold);

  if (!speedKitTestResult || !competitorTestResult) {
    return null;
  }

  const optimizedComparison = await comparisonFactory.create(
    bulkTest.params.url,
    {
      ...bulkTest.params,
      skipPrewarm: true,
      speedKitConfig: bulkTest.speedKitConfig,
    }
  );
  return await setTestResultsAndFactors(
    db,
    optimizedComparison,
    speedKitTestResult,
    competitorTestResult
  );
}

/**
 * Finds the optimal combination of Speed Kit and competitor test results.
 * @param {model.BulkTest} bulkTest - The bulk test to search.
 * @param {string} mainFactor - The main factor to compare.
 * @param {number} threshold - The threshold to exceed.
 * @returns {[model.TestResult | null, model.TestResult | null]} The found test results.
 */
function findOptimalTestResults(
  bulkTest: model.BulkTest,
  mainFactor: string,
  threshold: number
): [model.TestResult | null, model.TestResult | null] {
  let bestSpeedKitResult: model.TestResult | null = null;
  let bestCompetitorResult: model.TestResult | null = null;
  let bestFactor = 0;

  for (const skOverview of bulkTest.testOverviews) {
    const skResult = skOverview.speedKitTestResult;
    if (!skResult || !skResult.firstView) continue;

    for (const compOverview of bulkTest.testOverviews) {
      const compResult = compOverview.competitorTestResult;
      if (!compResult || !compResult.firstView) continue;

      const factor = compResult.firstView[mainFactor] / skResult.firstView[mainFactor];

      if (factor > threshold && factor < bestFactor) {
        bestSpeedKitResult = skResult;
        bestCompetitorResult = compResult;
        bestFactor = factor;
      } else if (factor > bestFactor) {
        bestSpeedKitResult = skResult;
        bestCompetitorResult = compResult;
        bestFactor = factor;
      }
    }
  }

  return [bestSpeedKitResult, bestCompetitorResult];
}

/**
 * Sets test results and calculates factors for the optimized comparison.
 * @param {baqend} db - The Baqend instance.
 * @param {model.TestOverview} optimizedComparison - The comparison to update.
 * @param {model.TestResult} speedKitTestResult - The selected Speed Kit test result.
 * @param {model.TestResult} competitorTestResult - The selected competitor test result.
 * @returns {model.TestOverview} The updated optimized comparison.
 */
async function setTestResultsAndFactors(
  db: baqend,
  optimizedComparison: model.TestOverview,
  speedKitTestResult: model.TestResult,
  competitorTestResult: model.TestResult
): Promise<model.TestOverview> {
  optimizedComparison.speedKitTestResult = speedKitTestResult;
  optimizedComparison.competitorTestResult = competitorTestResult;

  optimizedComparison.factors = factorize(
    db,
    competitorTestResult.firstView!,
    speedKitTestResult.firstView!
  );

  await optimizedComparison.optimisticSave(() => {
    setSuccess(optimizedComparison);
  });

  return optimizedComparison;
}
