import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { Status } from './_Status'

/**
 * GET: Get latest successful comparison of a given domain.
 */
export async function get(db: baqend, request: Request, response: Response) {
  const { query: { url } } = request
  if (!url) {
    throw new Abort('You have to provide a "url" query parameter.')
  }

  const latestComparison: model.TestOverview | null = await db.TestOverview.find()
    .eq('url', url)
    .eq('status', Status.SUCCESS)
    .descending('updatedAt')
    .singleResult()
  const { factors = null } = latestComparison

  response.send({ factors })
}
