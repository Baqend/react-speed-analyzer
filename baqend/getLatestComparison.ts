import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { booleanOf, mapObj, take, truncateUrl } from './_helpers'
import { Status } from './_Status'

function swap<U>(input: {[key: string]: {}}): any {
  const result = Object.create(null)
  for (const [key, value] of Object.entries(input)) {
    for (const [key2, value2] of Object.entries(value)) {
      const obj = result[key2] || Object.create(null)
      obj[key] = value2

      result[key2] = obj
    }
  }

  return result
}

/**
 * Loads a TestOverview for a given Url.
 */
async function loadTestOverview(db: baqend, url: string, isSpeedKitComparison: boolean): Promise<model.TestOverview | null> {
  const truncatedUrl = await truncateUrl(url)
  const testOverview = await db.TestOverview.find()
    .eq('url', truncatedUrl)
    .eq('isSpeedKitComparison', isSpeedKitComparison)
    .eq('status', Status.SUCCESS)
    .isNotNull('factors')
    .descending('updatedAt')
    .singleResult({ depth: 1 })

  if (testOverview) {
    return testOverview
  }

  return db.TestOverview.find()
    .eq('url', url)
    .eq('isSpeedKitComparison', isSpeedKitComparison)
    .eq('status', Status.SUCCESS)
    .isNotNull('factors')
    .descending('updatedAt')
    .singleResult({ depth: 1 })
}

export async function getLatestComparison(db: baqend, url: string, isSpeedKitComparison: boolean): Promise<any> {
  const latestComparison = await loadTestOverview(db, url, isSpeedKitComparison)

  if (!latestComparison) {
    return { url, speedKit: isSpeedKitComparison, id: null, fields: null }
  }

  const {
    id,
    factors: allFactors,
    competitorTestResult: { firstView: competitorValues },
    speedKitTestResult: { firstView: speedKitValues },
  } = latestComparison

  const factors = mapObj(take(allFactors!, 'speedIndex', 'ttfb', 'firstMeaningfulPaint'), value => Math.ceil(value * 100))
  const competitor = take(competitorValues!, 'speedIndex', 'ttfb', 'firstMeaningfulPaint')
  const speedKit = take(speedKitValues!, 'speedIndex', 'ttfb', 'firstMeaningfulPaint')

  const fields = swap({ factors, competitor, speedKit })

  return { url, speedKit: isSpeedKitComparison, id, fields }
}

/**
 * GET: Get latest successful comparison of a given domain.
 */
export async function get(db: baqend, request: Request, response: Response) {
  const { query: { url, speedKit: isSpeedKitComparisonStr = 'false' } } = request
  const isSpeedKitComparison = booleanOf(isSpeedKitComparisonStr as string | boolean)

  if (!url) {
    throw new Abort('You have to provide a "url" query parameter.')
  }

  response.send(await getLatestComparison(db, url as string, isSpeedKitComparison))
}
