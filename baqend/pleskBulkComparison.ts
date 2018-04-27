import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { generateHash, getDateString } from './_helpers'
import { startBulkComparison } from './startBulkComparison'
import { DEFAULT_PLESK_PRIORITY } from './_TestBuilder'

const defaultComparison = {
  caching: false,
  mobile: false,
  competitorTestResult: '',
  speedKitTestResult: '',
  factors: { speedIndex: null },
  hasFinished: true,
  speedKitVersion: null,
  isSpeedKitComparison: false,
}

/**
 * Sorts the comparisons of a multi comparison and finds the one with the best Speed Index.
 */
function findBestComparison(multiComparison: model.BulkTest): model.TestOverview | null {
  const testOverviews = multiComparison.testOverviews.sort((a, b) => {
    if (a.factors === b.factors) {
      return 0
    }

    if (a.factors && !b.factors) {
      return -1
    } else if (b.factors && !a.factors) {
      return 1
    }

    const siA = a.factors!.speedIndex
    const siB = b.factors!.speedIndex

    if (siA === siB) {
      return 0
    }

    if (siA !== null && siB === null) {
      return -1
    } else if (siA === null && siB !== null) {
      return 1
    }

    return siA < siB ? -1 : 1
  })

  return testOverviews[0] || null
}

/**
 * Checks if something is a string array
 */
function isNotStringArray(it: any) {
  if (it instanceof Array) {
    return it.some(item => typeof item !== 'string')
  }

  return true
}

/**
 * GET: Get state of bulk comparisons by domain URL and ID.
 */
export async function get(db: baqend, request: Request, response: Response) {
  const bulkComparisonId = request.query.bulkComparisonId
  const url = request.query.url
  if (!bulkComparisonId) {
    throw new Abort('You have to provide bulkComparisonId.')
  }

  const bulkComparison = await db.BulkComparison.load(bulkComparisonId, { depth: 2 })
  if (!url) {
    const comparisons: any = {};
    bulkComparison.multiComparisons.forEach((multiComparison) => {
      if (multiComparison.hasFinished) {
        const comparison = bulkComparison.comparisonsToStart.find((comparison) => comparison.puppeteer.url === multiComparison.url)
        if (comparison) {
          comparisons[comparison.url] = findBestComparison(multiComparison)
        }
      }
    })

    response.send({
      bulkComparisonId,
      comparisons,
    })
    return
  }

  // Find bulk test for URL
  const comparisonToStart = bulkComparison.comparisonsToStart.find((comparison) => comparison.url === url)
  if (!comparisonToStart) {
    const comparison = Object.assign(defaultComparison, { url })
    response.send({
      bulkComparisonId,
      url,
      comparison,
    })
    return
  }

  const { multiComparisonId } = comparisonToStart
  const bulkTest = bulkComparison.multiComparisons.find((multiComparison) => multiComparison.id === multiComparisonId)
  if (!bulkTest || !bulkTest.hasFinished) {
    response.send({ bulkComparisonId, url, comparison: null })
    return
  }

  // Find best comparison and return it
  const comparison = findBestComparison(bulkTest)
  response.send({ bulkComparisonId, url, comparison })
}

/**
 * POST: Start bulk comparisons for given domains.
 */
export async function post(db: baqend, request: Request, response: Response) {
  const { body } = request
  if (isNotStringArray(body)) {
    response.status(400)
    response.send({ error: 'Please send an array of domain names.' })
  }

  const domainNames: string[] = body
  const domainMap = domainNames.map((domain, index) => [domainNames[index], domain] as [string, string])

  try {
    const id = `${getDateString()}-plesk-${generateHash()}`
    const tests = domainNames.map(domainName => ({ url: domainName, priority: DEFAULT_PLESK_PRIORITY, runs: 2 }))
    startBulkComparison(db, id, 'plesk', tests)

    response.send({ bulkComparisonId: `/db/BulkComparison/${id}`, domainMap })
  } catch (e) {
    response.status(500)
    response.send({ error: e.message, stack: e.stack, domainNames })
  }
}
