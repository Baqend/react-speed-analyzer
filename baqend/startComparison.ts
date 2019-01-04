import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'

const MAX_PUPPETEER_RETRIES = 2;

/**
 * Baqend code API call.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { comparisonWorker, comparisonFactory, puppeteer } = bootstrap(db)

  const callPuppeteer = async (params: TestParams) => {
    const puppeteerInfo = await puppeteer.analyze(params.url, params.mobile, params.location, params.preload)
    // Retry Puppeteer analysis if Speed Kit is excepted to be installed but no installation was found.
    if (params.speedKitExpected && !puppeteerInfo.speedKit) {
      throw new Error('Expected result to be Speed Kit, but was not.')
    }

    return puppeteerInfo
  }

  const callPuppeteerWithRetries = async (params: TestParams, retries = 0): Promise<model.Puppeteer> => {
    try {
      return await callPuppeteer(params)
    } catch (err) {
      if (retries <= MAX_PUPPETEER_RETRIES) {
        return callPuppeteerWithRetries(params, retries + 1);
      }

      throw err
    }
  }

  const updateWithPuppeteer = async (params: TestParams, comparison: model.TestOverview) => {
    try {
      const puppeteerInfo = await callPuppeteerWithRetries(params)
      const updatedComparison = await comparisonFactory.updateComparison(comparison, puppeteerInfo, params)
      comparisonWorker.next(updatedComparison).catch((err) => db.log.error(err.message, err))

      return updatedComparison
    } catch ({ message, status = 500 }) {
      await comparisonFactory.updateComparisonWithError(comparison, message, status)
      return comparison
    }
  }

  const { withPuppeteer = true, ...params } = req.body as { withPuppeteer?: boolean } & TestParams
  const comparison = await comparisonFactory.createComparison(params.url)

  if (withPuppeteer) {
    const updatedComparison = await updateWithPuppeteer(params, comparison)

    res.status(200)
    res.send(updatedComparison)
    return
  }

  // async call to update the testOverview with the puppeteer data
  updateWithPuppeteer(params, comparison)

  res.status(200)
  res.send(comparison)
}
