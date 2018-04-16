import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { assignObject } from './_helpers'

/**
 * Create a Testseries object.
 */
function createTestseries(db: baqend, url: string, cronpattern: string, end: number, options: any) {
  const { start = Date.now() } = options

  const series: model.Testseries = new db.Testseries()
  series.url = url
  series.start = new Date(start)
  series.cronpattern = cronpattern
  series.end = new Date(end)
  series.testEntries = []
  assignObject(series, options, 'runs', 'location', 'mobile', 'whitelist', 'speedKitConfig')

  return series.save()
}

/**
 * Baqend API call.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { body } = req

  const {
    url,
    cronpattern,
    end,
    ...options
  } = body
  db.log.info('Starting testseries', { url, cronpattern, end, options })

  try {
    const testseries = await createTestseries(db, url, cronpattern, end, options)
    const job: model.JobDefinition = new db['jobs.Definition']()
    job.module = 'cronTestseries'
    job.cronpattern = cronpattern
    job.startsAt = testseries.start
    job.expiresAt = testseries.end
    job.testseries = testseries

    await job.save()

    res.status(200)
    res.send({ res: 'Testseries scheduled' })
  } catch (e) {
    res.status(400)
    res.send({ error: e.message, stack: e.stack, url, cronpattern, end })
  }
}

// JSON.stringify({
//   url: "https://www.cnouch.de/",
//   cronpattern: "0 */2 * * * *",
//   end: new Date(Date.now() + (30*60*1000)),
//   runs: 2,
//   speedKitConfig: {
//     appName: "makefast-dev",
//     whitelist: [{ host: [ "www.cnouch.de", "i.cnouch.de", "img.idealo.com", "static.criteo.net", "img.billiger.de", "static.trbo.com" ]}, { url: [ "www.google-analytics.com/analytics.js", "https://www.google-analytics.com/plugins/ua/ec.js" ]}],
//     userAgentDetection: false,
//   }
// })
