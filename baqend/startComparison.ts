import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { start } from 'repl'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'

const MAX_PUPPETEER_RETRIES = 2;

/**
 * Baqend code API call.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { comparisonWorker, comparisonFactory, puppeteer } = bootstrap(db)

  const callPuppeteer = async (params: TestParams, retries: number) => {
    const puppeteerInfo = await puppeteer.analyze(params.url, params.mobile, params.location, true, params.preload, params.app)
    // Retry Puppeteer analysis if Speed Kit is excepted to be installed but no installation was found.
    // Only consider this error when it is not the last retry.
    if (params.speedKitExpected && !puppeteerInfo.speedKit && retries <= MAX_PUPPETEER_RETRIES - 1) {
      throw new Error('Expected result to be Speed Kit, but was not.')
    }

    return puppeteerInfo
  }

  const callPuppeteerWithRetries = async (db:baqend, params: TestParams, retries = 0): Promise<model.Puppeteer> => {
    const startTime = Date.now();
    try {
      return await callPuppeteer(params, retries)
    } catch (err) {
      const timeAfterStart = Math.ceil((Date.now() - startTime) / 1000);
      db.log.error(`Puppeteer call no. ${retries + 1} has failed after ${timeAfterStart} seconds.`);
      if (retries <= MAX_PUPPETEER_RETRIES) {
        await new Promise(resolve => setTimeout(() => resolve(), 5000));
        return callPuppeteerWithRetries(db, params, retries + 1);
      }

      throw err
    }
  }

  const updateWithPuppeteer = async (db: baqend, params: TestParams, comparison: model.TestOverview) => {
    try {
      const puppeteerInfo = await callPuppeteerWithRetries(db, params)
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
    const updatedComparison = await updateWithPuppeteer(db, params, comparison)

    res.status(200)
    res.send(updatedComparison)
    return
  }

  // async call to update the testOverview with the puppeteer data
  updateWithPuppeteer(db, params, comparison)

  res.status(200)
  res.send(comparison)
}
