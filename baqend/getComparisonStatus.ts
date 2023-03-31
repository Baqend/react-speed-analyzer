import { baqend, StatusString, model } from 'baqend'
import { Request, Response } from 'express'


/**
 * @param db The Baqend instance.
 * @param comparisonId The comparison ID.
 * @return The current comparison status.
 */
async function getComparisonStatus(db: baqend, comparisonId: string): Promise<StatusString> {
  const idPrefix = '/db/TestOverview/'
  const preparedComparisonId = comparisonId.includes(idPrefix) ? comparisonId : idPrefix + comparisonId
  const comparison: model.TestOverview = await db.TestOverview.load(preparedComparisonId)
  if (!comparison) {
    throw new Abort(`No comparison was found for the id ${comparisonId}`)
  }

  return comparison.status
}

/**
 * Baqend code API call.
 */
export async function get(db: baqend, req: Request, res: Response) {
  if (!req.query.id) {
    throw new Abort('Please provide a "id" parameter')
  }
  const comparisonStatus = await getComparisonStatus(db, req.query.id as string)
  res.send(comparisonStatus)
}
