import { generateSpeedKitConfig, getTLD } from '../helper/configHelper'
import {
  INIT_TEST,
  START_TEST,
  TESTOVERVIEW_SAVE,
  CHANGE_SPEED_KIT_CONFIG,
  CALL_PAGESPEED_INSIGHTS_GET,
  START_TEST_COMPETITOR_POST,
  START_TEST_SPEED_KIT_POST,
  RATE_LIMITER_GET,
  NORMALIZE_URL_POST,
  RESET_TEST_RESULT,
} from './types'

/**
 * Triggers the start of a new test.
 */
export const startTest = () => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    //reset the result store
    dispatch({ type: RESET_TEST_RESULT })
    dispatch({ type: INIT_TEST })

    try {
      await prepareTest({ dispatch, getState, db })

      const { isRateLimited, isBaqendApp } = getState().result
      const { url, isMobile } = getState().config

      if(!isRateLimited && !isBaqendApp) {
        dispatch({ type: START_TEST })

        await createTestOverview({ dispatch, getState, db })
        await Promise.all([
          callPageSpeedInsightsAPI({ dispatch, getState, db, url, isMobile }),
          startCompetitorTest({ dispatch, getState, db }),
          startSpeedKitTest({ dispatch, getState, db })
        ])

        const { testOverview } = getState().result
        dispatch(await saveTestOverview(testOverview))
      }
    } catch(e) {console.log(e)}
  }
})

/**
 * Saves a given testOverview object to the baqend database
 * @param testOverview The testOverview object to be saved.
 */
export const saveTestOverview = (testOverview) => ({
  'BAQEND': [testOverview, ({ dispatch, getState, db }, ref) => ref.save().then(() => dispatch({
    type: TESTOVERVIEW_SAVE,
    payload: ref
  }))]
})

/**
 * Prepares the test before its execution (check rate limiting and normalize url).
 * @param dispatch Method to dispatch an action input.
 * @param getState Method to get the state of the redux store.
 * @param db The baqend database instance.
 */
export const prepareTest = async ({ dispatch, getState, db }) => {
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

/**
 * Creates a new testOverview object and generates a unique id for it.
 * @param dispatch Method to dispatch an action input.
 * @param getState Method to get the state of the redux store.
 * @param db The baqend database instance.
 */
const createTestOverview = async ({ dispatch, getState, db }) => {
  const { url, location, caching, isMobile, speedKitConfig, activityTimeout } = getState().config
  const { isSpeedKitComparison }  = getState().result
  const testOverview = new db.TestOverview()
  const tld = getTLD(url)
  const uniqueId = await db.modules.post('generateUniqueId', { entityClass: 'TestOverview' })

  testOverview.id = uniqueId + tld.substring(0, tld.length - 1)
  testOverview.url = url
  testOverview.location = location
  testOverview.caching = caching
  testOverview.mobile = isMobile
  testOverview.speedKitConfig = speedKitConfig
  testOverview.activityTimeout = activityTimeout
  testOverview.isSpeedKitComparison = isSpeedKitComparison

  dispatch({
    type: TESTOVERVIEW_SAVE,
    payload: await testOverview.save()
  })
}

/**
 * Call the Pagespeed Insights API of Google.
 * @param dispatch Method to dispatch an action input.
 * @param db The baqend database instance.
 * @param url The URL to be tested.
 * @param isMobile Boolean to verify whether the mobile version should be tested or not.
 */
const callPageSpeedInsightsAPI = async ({ dispatch, db,  url, isMobile }) => {
  const pageSpeedInsightsResult = await db.modules.get('callPageSpeed', { url, mobile: isMobile })

  dispatch({
    type: CALL_PAGESPEED_INSIGHTS_GET,
    payload: pageSpeedInsightsResult,
  })
}

/**
 * Starts the test for the competitor version.
 * @param dispatch Method to dispatch an action input.
 * @param getState Method to get the state of the redux store.
 * @param db The baqend database instance.
 */
const startCompetitorTest = async ({ dispatch, getState, db }) => {
  const { isSpeedKitComparison }  = getState().result
  const { url, location, caching, isMobile:mobile, activityTimeout } = getState().config

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

/**
 * Starts the test for the speed kit version.
 * @param dispatch Method to dispatch an action input.
 * @param getState Method to get the state of the redux store.
 * @param db The baqend database instance.
 */
const startSpeedKitTest = async ({ dispatch, getState, db }) => {
  const { isSpeedKitComparison } = getState().result
  const {
    url,
    location,
    caching,
    isMobile,
    speedKitConfig,
    activityTimeout
  } = getState().config

  const competitorTestId = await db.modules.post('queueTest', {
    url,
    activityTimeout,
    isSpeedKitComparison,
    speedKitConfig: speedKitConfig || generateSpeedKitConfig(url, '', isMobile),
    location,
    isClone: true,
    caching,
    mobile: isMobile,
  })

  dispatch({
    type: START_TEST_SPEED_KIT_POST,
    payload: competitorTestId,
  })
}
