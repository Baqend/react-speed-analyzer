import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { Status } from './_Status'

/**
 * GET: Get latest successful comparison of a given domain.
 */
export async function get(db: baqend, request: Request, response: Response) {
  const url = request.query.url
  if (!url) {
    throw new Abort('You have to provide a url.')
  }

  const latestComparison: model.TestOverview = await db.TestOverview.find()
    .eq('url', url)
    .eq('status', Status.SUCCESS)
    .descending('updatedAt')
    .singleResult()

  response.send({ factors: latestComparison ? latestComparison.factors : null })
}
