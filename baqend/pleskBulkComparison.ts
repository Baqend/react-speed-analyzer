import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { generateHash, getDateString } from './_helpers'
import { Status } from './_Status'
import { startBulkComparison } from './startBulkComparison'
import { DEFAULT_PLESK_PRIORITY } from './_TestBuilder'

const defaultComparison = {
  caching: false,
  mobile: false,
  competitorTestResult: '',
  speedKitTestResult: '',
  factors: { speedIndex: null },
  status: Status.SUCCESS,
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
function isStringArray(it: any) {
  if (it instanceof Array) {
    return it.some(item => typeof item === 'string')
  }

  return false
}

/**
 * GET: Get state of bulk comparisons by domain URL and ID.
 */
export async function get(db: baqend, request: Request, response: Response) {
  const bulkComparisonId = request.query.bulkComparisonId
  const url = request.query.url
  const deepLoading = request.query.deepLoading
  const depth = deepLoading === "true" ? 3 : 2;
  if (!bulkComparisonId && !url) {
    throw new Abort('You have to provide a bulkComparisonId or an url.')
  }

  if (!bulkComparisonId) {
    const comparison = await db.TestOverview.find().eq('url', url).descending('createdAt').singleResult({depth: depth - 2})
    if (!comparison) {
      throw new Abort('There could be no test analysis found for your url.')
    }

    response.send({ bulkComparisonId: null, url, comparison: comparison.toJSON({depth: depth - 2}) })
    return
  }

  const bulkComparison = await db.BulkComparison.load(bulkComparisonId, { depth })
  if (!url) {
    const comparisons: any = {};
    bulkComparison.multiComparisons.forEach((multiComparison) => {
      if (multiComparison.hasFinished) {
        const comparison = bulkComparison.comparisonsToStart.find((comparison) => {
          return comparison.multiComparisonId === multiComparison.id;
        })
        if (comparison) {
          const bestComparison = findBestComparison(multiComparison)
          if (!bestComparison) {
            comparisons[comparison.url] = Object.assign(defaultComparison, { url: comparison.url })
            return
          }

          comparisons[comparison.url] = bestComparison.toJSON({depth: depth - 2})
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
  // Check if there is no bulkTest or the bulkTest has not finished yet
  if (!bulkTest || !bulkTest.hasFinished) {
    // The corresponding bulkComparison is already finished (probably because of an error)
    // There will no bulkTest result be generated in the future => return default comparison
    if (bulkComparison.hasFinished) {
      const comparison = Object.assign(defaultComparison, { url })
      response.send({ bulkComparisonId, url, comparison })
    }

    // The corresponding bulkComparison is not finished yet. There will be a bulkTest result generated in the future
    response.send({ bulkComparisonId, url, comparison: null })
    return
  }

  // Find best comparison and return it
  const bestComparison = findBestComparison(bulkTest)
  if (!bestComparison) {
    response.send({ bulkComparisonId, url, comparison: Object.assign(defaultComparison, { url }) })
    return;
  }

  response.send({ bulkComparisonId, url, comparison: bestComparison.toJSON({depth: depth - 2}) })
}

/**
 * POST: Start bulk comparisons for given domains.
 */
export async function post(db: baqend, request: Request, response: Response) {
  const { body } = request
  const domainNames: string[] = isStringArray(body) ? body : (body && body.domains)
  if (!domainNames) {
    response.status(400)
    response.send({ error: 'Please send an array of domain names.' })
  }

  try {
    const id = `${getDateString()}-plesk-${generateHash()}`
    const priority = body.priority !== null ? body.priority : DEFAULT_PLESK_PRIORITY
    const tests = domainNames.map(domainName => ({ url: domainName, priority, runs: 1 }))
    startBulkComparison(db, id, 'plesk', tests)

    const domainMap = domainNames.map((domain, index) => [domainNames[index], domain] as [string, string])
    response.send({ bulkComparisonId: `/db/BulkComparison/${id}`, domainMap })
  } catch (e) {
    response.status(500)
    response.send({ error: e.message, stack: e.stack, domainNames })
  }
}
