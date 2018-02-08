import { generateSpeedKitConfig, getTLD } from '../helper/configHelper'
import {
  ADD_ERROR,
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
    try {
      const rateLimitResult = await db.modules.get('rateLimiter')
      dispatch({
        type: RATE_LIMITER_GET,
        payload: rateLimitResult.isRateLimited
      })

      if(!rateLimitResult.isRateLimited) {
        const { url, isMobile } = getState().config
        const urlInfo = await db.modules.post('normalizeUrl', { urls: url, mobile: isMobile })

        if (urlInfo[0].isBaqendApp) {
          throw new Error("Url is already a Baqend app")
        }

        dispatch({
          type: NORMALIZE_URL_POST,
          payload: urlInfo[0]
        })
        return urlInfo[0]
      }
    } catch(e) {
      dispatch({ type: RESET_TEST_RESULT })
      dispatch({ type: ADD_ERROR, payload: e })
      throw e
    }
  }
})

/**
 * Triggers the start of a new test.
 */
export const startTest = (urlInfo = {}) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({ type: RESET_TEST_RESULT })
    try {
      // const { isBaqendApp } = urlInfo
      const { url, isMobile } = getState().config

      // if(!isBaqendApp) {
      dispatch({ type: START_TEST })
      const testOverview = await dispatch(createTestOverview({ ...urlInfo }))
      dispatch(callPageSpeedInsightsAPI({ testOverview, url, isMobile }))
      return testOverview
      // } else {
      // throw new Error("url is already a Baqend app")
      // }
    } catch(e) {
      dispatch({ type: RESET_TEST_RESULT })
      dispatch({ type: ADD_ERROR, payload: e })
      throw e
    }
  }
})

/**
 * Creates a new testOverview object and generates a unique id for it.
 * @param store
 */
export const createTestOverview = ({ speedkit, speedkitVersion }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const { url, location, caching, isMobile, speedKitConfig, activityTimeout } = getState().config
    const testOverview = new db.TestOverview()
    const tld = getTLD(url)

    const ids = await Promise.all([
      db.modules.post('generateUniqueId', { entityClass: 'TestOverview' }),
      dispatch(startCompetitorTest()),
      dispatch(startSpeedKitTest()),
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
})

/**
 * Call the Pagespeed Insights API of Google.
 * @param url The URL to be tested.
 * @param isMobile Boolean to verify whether the mobile version should be tested or not.
 */
const callPageSpeedInsightsAPI = ({ testOverview: testOverviewObject, url, isMobile }) => ({
  'BAQEND': [ testOverviewObject, async ({ dispatch, getState, db }, testOverview) => {
    const pageSpeedInsightsResult = await db.modules.get('callPageSpeed', { url, mobile: isMobile })

    dispatch({
      type: CALL_PAGESPEED_INSIGHTS_GET,
      payload: pageSpeedInsightsResult,
    })

    testOverview.partialUpdate()
      .set('psiDomains', pageSpeedInsightsResult.domains)
      .set('psiRequests', pageSpeedInsightsResult.requests)
      .set('psiResponseSize', pageSpeedInsightsResult.bytes)
      .set('psiScreenshot', pageSpeedInsightsResult.screenshot)

    return pageSpeedInsightsResult
  }]
})

/**
 * Starts the test for the competitor version.
 */
const startCompetitorTest = () => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const { isSpeedKitComparison }  = getState().result
    const { url, location, caching, isMobile: mobile, activityTimeout } = getState().config

    const competitorTestId = await db.modules.post('queueTest', {
      url,
      activityTimeout,
      isSpeedKitComparison,
      location,
      isClone: false,
      caching,
      mobile,
    })

    return competitorTestId.baqendId
  }
})

/**
 * Starts the test for the speed kit version.
 */
const startSpeedKitTest = () => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const { isSpeedKitComparison } = getState().result
    const { url, location, caching, isMobile, speedKitConfig, activityTimeout } = getState().config

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

    return competitorTestId.baqendId
  }
})
