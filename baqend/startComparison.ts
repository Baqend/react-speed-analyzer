import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'
import { resolveUrl } from './resolveUrl'

/**
 * Baqend code API call.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { comparisonWorker, comparisonFactory, pagetest } = bootstrap(db)

  const updateWithResolvedUrl = async (db: baqend, params: TestParams, comparison: model.TestOverview) => {
    try {
      const resolvedUrl = await resolveUrl(params.url)
      const updatedComparison = await comparisonFactory.updateComparison(resolvedUrl, comparison, params)
      comparisonWorker.next(updatedComparison).catch((err: any) => db.log.error(err.message, err))

      return updatedComparison
    } catch ({ message, status = 500 }) {
      await comparisonFactory.updateComparisonWithError(comparison, pagetest, { message, status })
      return comparison
    }
  }

  const { withPuppeteer = true, ...params } = req.body as { withPuppeteer?: boolean } & TestParams
  if (!params.url) {
    throw Abort('Please provide a url to start a performance test for')
  }

  const hostname = params.hostname || req.hostname;
  const comparison = await comparisonFactory.createComparison(params.url, hostname)

  if (withPuppeteer) {
    const updatedComparison = await updateWithResolvedUrl(db, params, comparison)

    res.status(200)
    res.send(updatedComparison)
    return
  }

  updateWithResolvedUrl(db, params, comparison)

  res.status(200)
  res.send(comparison)
}
