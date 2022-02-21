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

  const callPuppeteer = async (params: TestParams, tries: number) => {
    const puppeteerInfo = await puppeteer.analyze(params.url, params.mobile, params.location, true, params.preload, params.app, params.whitelist)
    // Retry Puppeteer analysis if Speed Kit is excepted to be installed but no installation was found.
    // Only consider this error when it is not the last retry.
    if (params.speedKitExpected && !puppeteerInfo.speedKit && tries <= MAX_PUPPETEER_RETRIES) {
      throw new Error('Expected result to be Speed Kit, but was not.')
    }

    return puppeteerInfo
  }

  const callPuppeteerWithRetries = async (db:baqend, params: TestParams, tries = 1): Promise<model.Puppeteer> => {
    const startTime = Date.now();
    try {
      return await callPuppeteer(params, tries)
    } catch (err) {
      const timeAfterStart = Math.ceil((Date.now() - startTime) / 1000);
      db.log.error(`Puppeteer call no. ${tries} has failed after ${timeAfterStart} seconds.`, {params});
      if (tries <= MAX_PUPPETEER_RETRIES) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10000));
        return callPuppeteerWithRetries(db, params, tries + 1);
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
  const hostname = params.hostname || req.hostname;
  const comparison = await comparisonFactory.createComparison(params.url, hostname)

  if (params.url.includes('www.etihad.com')) {
    const url = new URL(params.url);
    const defaultPuppeteer = new db.Puppeteer({
      url: params.url,
      displayUrl: params.url,
      scheme: '',
      host: url.host,
      protocol: url.protocol,
      domains: [],
      screenshot: null,
      type: new db.PuppeteerType({ framework: '', language: '', server: '' }),
      stats: new db.PuppeteerStats({ domains: 0, requests: 0, size: 0 }),
      speedKit: null,
      smartConfig: params.speedKitConfig,
      serviceWorkers: null,
    })

    comparisonFactory.updateComparison(comparison, defaultPuppeteer, params)
    res.status(200)
    res.send(comparison)
  }

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
