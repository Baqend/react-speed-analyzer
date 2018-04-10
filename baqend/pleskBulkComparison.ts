import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { startBulkComparison } from './startBulkComparison'

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
 * GET: Get state of bulk comparisons by domain URL and ID.
 */
export async function get(db: baqend, request: Request, response: Response) {
  const bulkComparisonId = request.query.bulkComparisonId
  const url = request.query.url
  if (!bulkComparisonId || !url) {
    throw new Abort('You have to provide bulkComparisonId and url.')
  }

  const bulkComparison = await db.BulkComparison.load(bulkComparisonId, { depth: 2 })

  // Find bulk test for URL
  const bulkTest = bulkComparison.multiComparisons.find((multiComparison) => multiComparison.url === url)
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
  const { tests, createdBy } = request.body
  const bulkComparison = await startBulkComparison(db, createdBy, tests)

  response.send({ bulkComparison })
}
