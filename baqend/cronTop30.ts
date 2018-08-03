import { baqend, model } from 'baqend'
import fetch from 'node-fetch'
import { generateHash, getDateString } from './_helpers'
import { BulkTestParams, startBulkComparison } from './startBulkComparison'

// The maximum number of iterations to check the status of given bulk tests (4 hours).
const MAX_INTERVAL_ITERATIONS = 480

// A list of test parameters to test.
const TOP_LIST: BulkTestParams[] =
  [
    { url: 'http://www.alibaba.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'http://www.condenast.com/', location: 'eu-central-1-docker:Chrome.FIOSNoLatency', runs: 10, mobile: false },
    { url: 'https://diply.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'http://www.espn.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'http://fandom.wikia.com/explore', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.golem.de/', location: 'eu-central-1-docker:Chrome.FIOSNoLatency', runs: 10, mobile: false },
    { url: 'https://imgur.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'http://www.kicker.de/', location: 'eu-central-1-docker:Chrome.FIOSNoLatency', runs: 10, mobile: false },
    { url: 'http://www.molsoncoors.com/en', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'http://www.msn.com/de-de/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.realtor.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.reddit.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.theguardian.com/international', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.tumblr.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.walmart.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.yelp.com/sf', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.ebay.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.office.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'http://www.imdb.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.wellsfargo.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'http://www.breitbart.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.microsoft.com/en-us/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.upworthy.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.wsj.com/news/us', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.usatoday.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.booking.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'https://www.tripadvisor.com/', location: 'us-east-1:Chrome.Native', runs: 10, mobile: false },
    { url: 'http://www.computerbild.de/', location: 'eu-central-1-docker:Chrome.FIOSNoLatency', runs: 10, mobile: false },
    { url: 'http://www.bild.de/', location: 'eu-central-1-docker:Chrome.FIOSNoLatency', runs: 10, mobile: false },
    { url: 'http://www.spiegel.de/', location: 'eu-central-1-docker:Chrome.FIOSNoLatency', runs: 10, mobile: false },
  ]

/**
 * Verifies display color for a given factor
 *
 * @param factor A number to be colored
 */
function factorColor(factor: number): string {
  // very good result
  if (factor > 3) {
    return '#00cc66'
  }
  // good result
  if (factor > 2) {
    return '#86bc00'
  }
  // ok result
  if (factor >= 1) {
    return '#cc9a00'
  }

  // bad result
  return '#ad0900'
}

/**
 * Verifies display color for a given diff
 *
 * @param diff A number to be colored
 */
function diffColor(diff: number): string {
  // very good result
  if (diff > 1) {
    return '#00cc66'
  }
  // good result
  if (diff > 0.5) {
    return '#86bc00'
  }
  // ok result
  if (diff >= 0) {
    return '#cc9a00'
  }

  // bad result
  return '#ad0900'
}

/**
 * Create table data cell (td) with optional color style
 *
 * @param data The data to be displayed
 * @param isFactor Boolean to decide how to generate the display color
 */
function createTableDataCell(data: number, isFactor = true): string {
  if (!Number.isFinite(data)) {
    return `<td style="text-align: center">–</td>`
  }

  return `<td style="text-align: right; color: ${isFactor ? factorColor(data) : diffColor(data)}">${data.toFixed(2)}</td>`
}

/**
 * Rounds a number to its hundredths.
 */
function roundToHundredths(number: number): number {
  if (Number.isFinite(number)) {
    return Math.round(number * 100) / 100
  }

  return number
}

/**
 * Create the mail template to be send
 *
 * @param bulkTestMap A mapping of new and previous bulkTest objects
 */
function createMailTemplate(bulkTestMap: Map<model.BulkTest, model.BulkTest>): string {
  const totalValues = { SIPrevious: 0, SILatest: 0, SITotal: 0, FMPPrevious: 0, FMPLatest: 0, FMPTotal: 0 }
  let templateString = '<html><head><meta http-equiv="Content-Type" content="text/html charset=UTF-8"></head>' +
    '<body><table border="1" width="100%"><tr><th>URL</th><th>SI Ø Previous</th><th>SI Ø Latest</th><th>SI ∆</th>' +
    '<th>FMP Ø Previous</th><th>FMP Ø Latest</th><th>FMP ∆</th></tr>'

  for (const [previous, latest] of bulkTestMap) {
    // dummy object to ensure that factors is available
    const { factors: previousFactors = { speedIndex: NaN, firstMeaningfulPaint: NaN } }: { factors: Partial<model.Mean> } = previous
    const { factors: latestFactors = { speedIndex: NaN, firstMeaningfulPaint: NaN } }: { factors: Partial<model.Mean> } = latest

    const speedIndexDiff = latestFactors.speedIndex! - previousFactors.speedIndex!
    const firstMeaningfulPaintDiff = latestFactors.firstMeaningfulPaint! - previousFactors.firstMeaningfulPaint!

    // calculate total values
    if (previousFactors.speedIndex && latestFactors.speedIndex) {
      totalValues.SITotal += 1
      totalValues.SIPrevious += previousFactors.speedIndex
      totalValues.SILatest += latestFactors.speedIndex
    }

    if (previousFactors.firstMeaningfulPaint && latestFactors.firstMeaningfulPaint) {
      totalValues.FMPTotal += 1
      totalValues.FMPPrevious += previousFactors.firstMeaningfulPaint
      totalValues.FMPLatest += latestFactors.firstMeaningfulPaint
    }

    templateString +=
      `<tr>
         <th style="text-align: left; font-weight: bold">${latest.url}</th>
         ${createTableDataCell(previousFactors.speedIndex!)}
         ${createTableDataCell(latestFactors.speedIndex!)}
         ${createTableDataCell(speedIndexDiff, false)}
         ${createTableDataCell(previousFactors.firstMeaningfulPaint!)}
         ${createTableDataCell(latestFactors.firstMeaningfulPaint!)}
         ${createTableDataCell(firstMeaningfulPaintDiff, false)}
       </tr>`
  }

  const totalSpedIndexPrevious = roundToHundredths(totalValues.SIPrevious / totalValues.SITotal)
  const totalSpedIndexLatest = roundToHundredths(totalValues.SILatest / totalValues.SITotal)
  const totalSpeedIndexDiff = totalSpedIndexLatest - totalSpedIndexPrevious

  const totalFMPPrevious = roundToHundredths(totalValues.FMPPrevious / totalValues.FMPTotal)
  const totalFMPLatest = roundToHundredths(totalValues.FMPLatest / totalValues.FMPTotal)
  const totalFirstMeaningfulPaintDiff = totalFMPLatest - totalFMPPrevious

  templateString +=
    `<tr>
       <th style="text-align: left; font-weight: bold">Total</th>
       ${createTableDataCell(totalSpedIndexPrevious)}
       ${createTableDataCell(totalSpedIndexLatest)}
       ${createTableDataCell(totalSpeedIndexDiff, false)}
       ${createTableDataCell(totalFMPPrevious)}
       ${createTableDataCell(totalFMPLatest)}
       ${createTableDataCell(totalFirstMeaningfulPaintDiff, false)}
     </tr></table></body></html>`

  return templateString
}

/**
 * Load previous bulk test of a given bulk test (created by the cronjob)
 *
 * @param db The Baqend instance.
 * @param bulkTest The latest bulk test .
 */
function loadPreviousBulkTest(db: baqend, bulkTest: model.BulkTest): Promise<model.BulkTest> {
  return db.BulkTest.find()
    .eq('url', bulkTest.url)
    .eq('createdBy', bulkTest.createdBy)
    .lt('createdAt', bulkTest.createdAt)
    .descending('createdAt')
    .singleResult()
}

/**
 * Send a notification mail.
 *
 * @param template A template string to be send as email.
 */
async function sendMail(template: string): Promise<void> {
  await fetch('https://bbq.app.baqend.com/v1/code/top30Mail', {
    method: 'POST',
    body: JSON.stringify({ template }),
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Send a notification mail.
 *
 * @param db The Baqend instance.
 * @param bulkComparison The bulk comparison being executed.
 */
async function sendSuccessMail(db: baqend, bulkComparison: model.BulkComparison) {
  const loadPromises = bulkComparison.multiComparisons.map(async (bulkTest) => {
    await bulkTest.load({ refresh: true })
    const previous = await loadPreviousBulkTest(db, bulkTest)

    return [previous, bulkTest] as [model.BulkTest, model.BulkTest]
  })

  const bulkTestMap = new Map(await Promise.all(loadPromises))
  const template = createMailTemplate(bulkTestMap)

  await sendMail(template)
}

/**
 * Starts an interval to check whether all passed bulk test have finished.
 *
 * @param db The Baqend instance.
 * @param bulkComparison The bulk comparison being executed.
 */
function startCheckStateInterval(db: baqend, bulkComparison: model.BulkComparison) {
  let iterations = 0

  const interval = setInterval(async () => {
    await bulkComparison.load({ refresh: true })

    if (bulkComparison.hasFinished) {
      db.log.info('Clear interval because of success')
      clearInterval(interval)
      return sendSuccessMail(db, bulkComparison)
    }

    if ((iterations += 1) > MAX_INTERVAL_ITERATIONS) {
      db.log.error('Aborting interval to send top 30 mail because of timeout.')
      clearInterval(interval)
    }
  }, 30000)
}

/**
 * Starts a number of bulk tests and initiates the state checking process.
 *
 * @param db The Baqend instance.
 */
export async function call(db: baqend): Promise<void> {
  const id = `${getDateString()}-cronjob`
  const bulkComparison = await startBulkComparison(db,  id, 'cronjob', TOP_LIST)
  startCheckStateInterval(db, bulkComparison)
}
