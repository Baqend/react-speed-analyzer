import { generateSpeedKitConfig, getTLD } from '../helper/configHelper'
import {
  ADD_ERROR,
  INIT_TEST,
  START_TEST,
  TESTOVERVIEW_SAVE,
  CALL_PAGESPEED_INSIGHTS_GET,
  RATE_LIMITER_GET,
  NORMALIZE_URL_POST,
  RESET_TEST_RESULT,
} from './types'

import { isURL } from '../helper/utils'
import { updateConfigByTestOverview } from './config'

/**
 * Prepares the test before its execution (check rate limiting and normalize url).
 */
export const prepareTest = (url = null) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({
      type: INIT_TEST,
    })
    try {
      if (!isURL(url)) {
        throw new Error("Input is not a valid url")
      }
      const rateLimitResult = await db.modules.get('rateLimiter')
      dispatch({
        type: RATE_LIMITER_GET,
        payload: rateLimitResult.isRateLimited,
      })

      if(!rateLimitResult.isRateLimited) {
        const { mobile } = getState().config
        const urlInfo = await db.modules.post('normalizeUrl', { urls: url, mobile: mobile })
        if (!urlInfo[0]) {
          throw new Error("Input is not a valid url")
        }
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
      dispatch({
        type: RESET_TEST_RESULT,
      })
      dispatch({
        type: ADD_ERROR,
        payload: e,
      })
      throw e
    }
  }
})

/**
 * Triggers the start of a new test.
 */
export const startTest = (urlInfo = {}) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({
      type: RESET_TEST_RESULT
    })
    try {
      dispatch({
        type: START_TEST,
      })
      const testOverview = await dispatch(runComparison({ ...urlInfo }))
      return testOverview
    } catch(e) {
      dispatch({
        type: RESET_TEST_RESULT,
      })
      dispatch({
        type: ADD_ERROR,
        payload: e,
      })
      throw e
    }
  }
})

export const runComparison = ({ speedkit, speedkitVersion }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const { url, location, caching, mobile, speedKitConfig, activityTimeout } = getState().config
    const testOverview = await db.modules.post('runComparison', {
      url,
      location,
      caching,
      mobile,
      speedKitConfig,
      activityTimeout,
      isSpeedKitComparison: speedkit,
      speedKitVersion: speedkitVersion,
    })
    return testOverview
  }
})
