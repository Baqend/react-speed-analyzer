import { baqend, model } from 'baqend'
import { Request, Response } from 'express'

/**
 * @param db The Baqend instance.
 * @param comparisonId The comparison ID.
 * @return The comparison to be loaded.
 */
async function loadComparison(db: baqend, comparisonId: string): Promise<model.TestOverview> {
  const idPrefix = '/db/TestOverview/'
  const preparedComparisonId = comparisonId.includes(idPrefix) ? comparisonId : idPrefix + comparisonId
  const comparison: model.TestOverview = await db.TestOverview.load(preparedComparisonId)
  if (!comparison) {
    throw new Abort(`No comparison was found for the id ${comparisonId}`)
  }

  const competitorTestResult = await db.TestResult.load(comparison.competitorTestResult.id);
  const speedKitTestResult = await db.TestResult.load(comparison.speedKitTestResult.id);

  const parsedComparison = JSON.parse(JSON.stringify(comparison));
  return Object.assign(parsedComparison, { competitorTestResult, speedKitTestResult });
}

/**
 * Baqend code API call.
 */
export async function get(db: baqend, req: Request, res: Response) {
  if (!req.query.id) {
    throw new Abort('Please provide a "id" parameter')
  }
  const comparison = await loadComparison(db, req.query.id as string)
  res.send(comparison)
}
