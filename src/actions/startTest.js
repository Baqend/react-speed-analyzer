import { generateSpeedKitConfig, getTLD } from '../helper/configHelper'
import {
  TESTOVERVIEW_SAVE,
  START_TEST_COMPETITOR_POST,
  START_TEST_SPEED_KIT_POST,
  RATE_LIMITER_GET,
  NORMALIZE_URL_POST,
  RESET_TEST_RESULT,
} from './types'

export const startTest = () => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    //reset the result store
    dispatch({
      type: RESET_TEST_RESULT,
      payload: {}
    })

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
        dispatch(await saveTestOverview(testOverview))
      }
    } catch(e) {console.log(e)}
  }
})

export const saveTestOverview = (testOverview) => ({
  'BAQEND': [testOverview, ({ dispatch, getState, db }, ref) => ref.save().then(() => dispatch({
    type: TESTOVERVIEW_SAVE,
    payload: ref
  }))]
})

async function prepareTest({ dispatch, getState, db }) {
  const rateLimitResult = await db.modules.get('rateLimiter')

  dispatch({
    type: RATE_LIMITER_GET,
    payload: rateLimitResult.isRateLimited
  })

  if(!rateLimitResult.isRateLimited) {
    const { url, isMobile } = getState().config
    const normalizedUrlResult = await db.modules.post('normalizeUrl', { urls: url, mobile: isMobile })

    dispatch({
      type: NORMALIZE_URL_POST,
      payload: normalizedUrlResult[0]
    })
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
  dispatch({
    type: TESTOVERVIEW_SAVE,
    payload: await testOverview.save()
  })
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
