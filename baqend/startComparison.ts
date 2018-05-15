import { baqend } from 'baqend'
import { Request, Response } from 'express'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'

interface StartComparisonParams extends TestParams {
  url: string
}

/**
 * Baqend code API call.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { comparisonWorker, comparisonFactory, puppeteer } = bootstrap(db)

  try {
    // Get necessary options
    const { url, ...params } = req.body as StartComparisonParams
    const puppeteerInfo = await puppeteer.analyze(url, params.mobile)
    const comparison = await comparisonFactory.create(puppeteerInfo, params)
    comparisonWorker.next(comparison).catch((err) => db.log.error(err.message, err))

    res.status(200)
    res.send(comparison)
  } catch ({ message, stack, status = 500 }) {
    res.status(status)
    res.send({ message, stack, status })
  }
}
