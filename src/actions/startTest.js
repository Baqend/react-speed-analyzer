import { generateSpeedKitConfig, getTLD } from '../helper/configHelper'
import {
  CHANGE_URL,
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
 * Prepares the test before its execution (check rate limiting and normalize url).
 */
export const prepareTest = (url = null) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({ type: INIT_TEST })
    if (url) {
      dispatch({ type: CHANGE_URL, payload: url })
    }

    const rateLimitResult = await db.modules.get('rateLimiter')

    dispatch({
      type: RATE_LIMITER_GET,
      payload: rateLimitResult.isRateLimited
    })

    if(!rateLimitResult.isRateLimited) {
      const { url, isMobile } = getState().config
      const urlInfo = await db.modules.post('normalizeUrl', { urls: url, mobile: isMobile })
      dispatch({
        type: NORMALIZE_URL_POST,
        payload: urlInfo[0]
      })
      return urlInfo[0]
    }
  }
})

/**
 * Triggers the start of a new test.
 */
export const startTest = (urlInfo = {}) => ({
  'BAQEND': async (store) => {
    const { dispatch, getState, db } = store
    dispatch({ type: RESET_TEST_RESULT })
    try {
      // await prepareTest({ dispatch, getState, db })
      // debugger
      // const { isBaqendApp } = getState().result
      const { isBaqendApp } = urlInfo
      const { url, isMobile } = getState().config

      if(!isBaqendApp) {
        dispatch({ type: START_TEST })
        const testOverview = await createTestOverview({ ...store, ...urlInfo })

        callPageSpeedInsightsAPI({ dispatch, getState, db, url, isMobile })

        return testOverview
      } else {
        throw new Error("url is already a Baqend app")
      }
    } catch(e) {
      console.log(e)
      throw e
    }
  }
})

/**
 * Saves a given testOverview object to the baqend database
 * @param dispatch Method to dispatch an action input.
 * @param getState Method to get the state of the redux store.
 * @param testOverview The testOverview object to be saved.
 */
export const saveTestOverview = async ({ dispatch, getState }, testOverview) => {
  const res = await testOverview.save().then((r) => r.toJSON())
  dispatch({
    type: TESTOVERVIEW_SAVE,
    payload: res
  })
  return res
}

/**
 * Creates a new testOverview object and generates a unique id for it.
 * @param store
 */
const createTestOverview = async (params) => {
  const { speedkit, speedkitVersion, ...store } = params
  const { dispatch, getState, db } = store
  // debugger
  const { url, location, caching, isMobile, speedKitConfig, activityTimeout } = getState().config
  // const { isSpeedKitComparison, speedKitVersion }  = getState().result
  const testOverview = new db.TestOverview()
  const tld = getTLD(url)

  const ids = await Promise.all([
    db.modules.post('generateUniqueId', { entityClass: 'TestOverview' }),
    startCompetitorTest({ ...store }),
    startSpeedKitTest({ ...store }),
  ])

  testOverview.id = ids[0] + tld.substring(0, tld.length - 1)
  testOverview.url = url
  testOverview.location = location
  testOverview.caching = caching
  testOverview.mobile = isMobile
  testOverview.speedKitConfig = speedKitConfig
  testOverview.activityTimeout = activityTimeout
  testOverview.isSpeedKitComparison = speedkit
  testOverview.speedKitVersion = speedkitVersion
  testOverview.competitorTestResult = new db.TestResult({ id: ids[1] })
  testOverview.speedKitTestResult = new db.TestResult({ id: ids[2] })

  dispatch({
    type: TESTOVERVIEW_SAVE,
    payload: await testOverview.save()
  })
  return testOverview
}

/**
 * Call the Pagespeed Insights API of Google.
 * @param dispatch Method to dispatch an action input.
 * @param getState Method to get the state of the redux store.
 * @param db The baqend database instance.
 * @param url The URL to be tested.
 * @param isMobile Boolean to verify whether the mobile version should be tested or not.
 */
const callPageSpeedInsightsAPI = async ({ dispatch, getState, db,  url, isMobile }) => {
  const pageSpeedInsightsResult = await db.modules.get('callPageSpeed', { url, mobile: isMobile })
  dispatch({
    type: CALL_PAGESPEED_INSIGHTS_GET,
    payload: pageSpeedInsightsResult,
  })
  db.TestOverview.fromJSON(getState().result.testOverview).save()
  return pageSpeedInsightsResult
}

// const { testOverview } = getState().result
// dispatch(await saveTestOverview(testOverview))
//
// export const saveTestOverview = (testOverview) => ({
//   'BAQEND': [testOverview, ({ dispatch, getState, db }, ref) => ref.save().then(() => dispatch({
//     type: TESTOVERVIEW_SAVE,
//     payload: ref
//   }))]
// })

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

  // dispatch({
  //   type: START_TEST_COMPETITOR_POST,
  //   payload: competitorTestId,
  // })
  return competitorTestId.baqendId
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

  // dispatch({
  //   type: START_TEST_SPEED_KIT_POST,
  //   payload: competitorTestId,
  // })
  return competitorTestId.baqendId
}
