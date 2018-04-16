import { baqend, model } from 'baqend'
import { aggregateFields } from './_helpers'

type TestResultFieldPrefix = 'competitor' | 'speedKit'

const fields: Array<keyof model.Mean> = ['speedIndex', 'firstMeaningfulPaint', 'ttfb', 'domLoaded', 'fullyLoaded', 'lastVisualChange']

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
 * Gets the best result for a given field of the competitor or Speed Kit.
 *
 * @param bulkTest A bulk test to analyze.
 * @param prefix Either 'competitor' or 'speedKit'.
 * @param field The field to get the best result of.
 * @return Returns the result or NaN, if no result exists.
 */
function bestResult(bulkTest: model.BulkTest, prefix: TestResultFieldPrefix, field: string): number {
  const resultField = `${prefix}TestResult`
  const best = bulkTest.testOverviews.reduce((prev, { [resultField]: result }) => {
    if (result.firstView) {
      return Math.min(prev, result.firstView[field])
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
  const resultField = `${prefix}TestResult`
  const worst = bulkTest.testOverviews.reduce((prev, { [resultField]: result }) => {
    if (result.firstView) {
      return Math.max(prev, result.firstView[field])
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
    const competitorWorst = worstResult(bulkTest, 'competitor', field)
    const speedKitBest = bestResult(bulkTest, 'speedKit', field)

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
    const competitorBest = bestResult(bulkTest, 'competitor', field)
    const speedKitWorst = worstResult(bulkTest, 'speedKit', field)

    result[field] = (competitorBest / speedKitWorst) || null
  }

  return result
}

/**
 * Checks whether a test overview is finished.
 */
function hasTestOverviewFinished({ competitorTestResult, speedKitTestResult }: model.TestOverview): boolean {
  return competitorTestResult.hasFinished === true && speedKitTestResult.hasFinished === true
}

/**
 * Returns whether a bulk test has finished.
 */
function hasBulkTestFinished(bulkTest: model.BulkTest): boolean {
  return bulkTest.testOverviews.every(it => hasTestOverviewFinished(it))
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

    bulkTest.speedKitMeanValues = new db.Mean(aggregateFields(pickResults(bulkTest, 'speedKit'), fields));
    bulkTest.competitorMeanValues = new db.Mean(aggregateFields(pickResults(bulkTest, 'competitor'), fields));
    bulkTest.factors = factorize(db, bulkTest.competitorMeanValues, bulkTest.speedKitMeanValues);
    bulkTest.bestFactors = calcBestFactors(db, bulkTest);
    bulkTest.worstFactors = calcWorstFactors(db, bulkTest);
    bulkTest.completedRuns += 1;

    return bulkTest.save()
  } catch (e) {
    db.log.error('Error while computing bulk test aggregate.', { error: e.stack });

    return bulkTest
  }
}
