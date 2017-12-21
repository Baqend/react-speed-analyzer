import {
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_SAVE,
  START_TEST_COMPETITOR_POST,
  START_TEST_SPEED_KIT_POST,
  COMPETITOR_RESULT_NEXT,
  SPEED_KIT_RESULT_NEXT,
  RATE_LIMITER_GET,
  NORMALIZE_URL_POST,
  TEST
} from './types'

import { generateSpeedKitConfig } from '../helper/configHelper'
import { getTLD } from '../helper/configHelper'

export const startTest = () => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    try {
      await prepareTest({ dispatch, getState, db })

      const { isRateLimited, isBaqendApp } = getState().result
      if(!isRateLimited && !isBaqendApp) {
        await createTestOverview({ dispatch, getState, db })
        await Promise.all([
          startCompetitorTest({ dispatch, getState, db }),
          startSpeedKitTest({ dispatch, getState, db })
        ])

        const { testOverview } = getState().result
        dispatch(getTestOverview(testOverview))
      }
    } catch(e) {console.log(e)}
  }
})

export const getTestOverview = (json) => ({
  'BAQEND': [json, ({ dispatch, getState, db }, ref) => {
    return dispatch({
      type: 'TEST',
      payload: 'Test'
    })
  }]
})

async function prepareTest({ dispatch, getState, db }) {
  const rateLimitResult = await db.modules.get('rateLimiter')
  dispatch(updateRateLimited(rateLimitResult))

  if(!rateLimitResult.isRateLimited) {
    const { url, isMobile } = getState().config
    const normalizedUrlResult = await db.modules.post('normalizeUrl', { urls: url, mobile: isMobile })
    dispatch(setNormalizedUrl(normalizedUrlResult))
  }
}

async function createTestOverview({ dispatch, getState, db }) {
  const { url, location, caching, isMobile, whitelist } = getState().config
  const testOverview = new db.TestOverview()
  const tld = getTLD(url)
  const uniqueId = await db.modules.post('generateUniqueId', { entityClass: 'TestOverview' })
  testOverview.id = uniqueId + tld.substring(0, tld.length - 1)
  testOverview.url = url
  testOverview.location = location
  testOverview.caching = caching
  testOverview.mobile = isMobile
  testOverview.whitelist = whitelist
  dispatch(saveTestOverview(await testOverview.save()))
}

async function startCompetitorTest({ dispatch, getState, db }) {
  const { url, isSpeedKitComparison, location, caching, isMobile:mobile, activityTimeout } = getState().config
  const competitorTestId = await db.modules.post('queueTest', {
    url,
    activityTimeout,
    isSpeedKitComparison,
    location,
    isClone: false,
    caching,
    mobile,
  })

  dispatch({
    type: START_TEST_COMPETITOR_POST,
    payload: competitorTestId,
  })
}

async function startSpeedKitTest({ dispatch, getState, db }) {
  const { url, isSpeedKitComparison, whitelist, location, caching, isMobile:mobile, activityTimeout } = getState().config
  const speedKitConfig = generateSpeedKitConfig(url, whitelist, mobile)
  const competitorTestId = await db.modules.post('queueTest', {
    url,
    activityTimeout,
    isSpeedKitComparison,
    speedKitConfig,
    location,
    isClone: true,
    caching,
    mobile,
  })

  dispatch({
    type: START_TEST_SPEED_KIT_POST,
    payload: competitorTestId,
  })
}

function updateRateLimited(rateLimitResult) {
  return {
    type: RATE_LIMITER_GET,
    payload: rateLimitResult.isRateLimited
  }
}

function setNormalizedUrl(normalizedUrlResult) {
  return {
    type: NORMALIZE_URL_POST,
    payload: normalizedUrlResult[0]
  }
}

function saveTestOverview(testOverview) {
  return {
    type: TESTOVERVIEW_SAVE,
    payload: testOverview
  }
}

/**
 * Loads a testOverview object by a given testId
 * @param testId The id of the corresponding test
 */
export function loadTestOverviewByTestId(testId) {
  return {
    'BAQEND': {
      type: TESTOVERVIEW_LOAD,
      payload: (db) => db.TestOverview.load(testId)
    },
  }
}

/**
 * Subscribe to on a object by its id.
 * @param competitorId The id of the competitor test to subscribe on.
 */
export function subscribeOnCompetitorTestResult(competitorId) {
  return {
    'BAQEND': {
      type: COMPETITOR_RESULT_NEXT,
      payload: (db) => db.TestResult.find().equal('id', competitorId).resultStream()
    }
  }
}

/**
 * Subscribe to on a object by its id.
 * @param speedKitId The id of the speedKit test to subscribe on.
 */
export function subscribeOnSpeedKitTestResult(speedKitId) {
  return {
    'BAQEND': {
      type: SPEED_KIT_RESULT_NEXT,
      payload: (db) => db.TestResult.find().equal('id', speedKitId).resultStream()
    }
  }
}

