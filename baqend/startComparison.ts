import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'

async function updateWithPuppeteer(db: baqend, params: TestParams, comparison: model.TestOverview) {
  const { comparisonWorker, comparisonFactory, puppeteer } = bootstrap(db)

  const puppeteerInfo = await puppeteer.analyze(params.url, params.mobile)
  const updatedComparison = await comparisonFactory.updateComparison(comparison, puppeteerInfo, params)
  comparisonWorker.next(updatedComparison).catch((err) => db.log.error(err.message, err))
}

/**
 * Baqend code API call.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { comparisonFactory } = bootstrap(db)

  try {
    // Get necessary options
    const params = req.body as TestParams
    const comparison = await comparisonFactory.createComparison(params.url)

    // async call to update the testOverview with the puppeteer data
    updateWithPuppeteer(db, params, comparison)

    res.status(200)
    res.send(comparison)
  } catch ({ message, stack, status = 500 }) {
    res.status(status)
    res.send({ message, stack, status })
  }
}
