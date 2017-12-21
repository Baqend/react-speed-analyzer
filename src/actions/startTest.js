import {
  TESTOVERVIEW_CREATE,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_SAVE,
  START_TEST_COMPETITOR_POST_REQUEST,
  START_TEST_COMPETITOR_POST_SUCCESS,
  START_TEST_COMPETITOR_POST_FAILURE,
  START_TEST_SPEED_KIT_POST_REQUEST,
  START_TEST_SPEED_KIT_POST_SUCCESS,
  START_TEST_SPEED_KIT_POST_FAILURE,
  COMPETITOR_RESULT_NEXT,
  SPEED_KIT_RESULT_NEXT
} from './types'

import { generateSpeedKitConfig } from '../helper/configHelper'
import { getTLD } from '../helper/configHelper'

/**
 * Create a new testOverview object with uniqueId based on the url.
 * @param url The url to be tested.
 * @param location The location of the test instance.
 * @param caching A flag to detect whether to use caching or not.
 * @param isMobile A flag to detect whether it i a mobile website or not.
 * @param whitelist A comma separated list of strings.
 */
export function createTestOverview({ url, location, caching, isMobile, whitelist }) {
  return {
    'BAQEND': {
      type: TESTOVERVIEW_CREATE,
      payload: async (db) => {
        const testOverview = new db.TestOverview()
        const tld = getTLD(url)
        const uniqueId = await db.modules.post('generateUniqueId', { entityClass: 'TestOverview' })
        testOverview.id = uniqueId + tld.substring(0, tld.length - 1)
        testOverview.url = url
        testOverview.location = location
        testOverview.caching = caching
        testOverview.mobile = isMobile
        testOverview.whitelist = whitelist
        return testOverview.save()
      }
    },
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
 * Saves a testOverview object
 * @param testOverview The testOverview object to be saved
 */
export function saveTestOverview(testOverview) {
  return {
    'BAQEND': {
      type: TESTOVERVIEW_SAVE,
      payload: [ testOverview, (db, testOverview) => testOverview.save()]
    }
  }
}

/**
 * Start test for the competitor by calling the queueTest module.
 * @param url The url of the website to be tested.
 * @param isSpeedKitComparison A flag to detect whether the website already uses speedKit.
 * @param location The location of the test instance.
 * @param caching A flag to detect whether to use caching or not.
 * @param mobile A flag to detect whether it i a mobile website or not.
 * @param activityTimeout A time to wait after the last request.
 */
export function startCompetitorTest({
  url,
  isSpeedKitComparison,
  location,
  caching,
  isMobile: mobile,
  activityTimeout = 75,
}) {
  return {
    'BAQEND': {
      types: [
        START_TEST_COMPETITOR_POST_REQUEST,
        START_TEST_COMPETITOR_POST_SUCCESS,
        START_TEST_COMPETITOR_POST_FAILURE
      ],
      payload: (db) => db.modules.post('queueTest', {
        url,
        activityTimeout,
        isSpeedKitComparison,
        location,
        isClone: false,
        caching,
        mobile,
      })
    },
  }
}

/**
 * Start test for the speedKit by calling the queueTest module.
 * @param url The url of the website to be tested.
 * @param isSpeedKitComparison A flag to detect whether the website already uses speedKit.
 * @param location The location of the test instance.
 * @param caching A flag to detect whether to use caching or not.
 * @param whitelist The whitelist string with comma-separated values.
 * @param mobile A flag to detect whether it i a mobile website or not.
 * @param activityTimeout A time to wait after the last request.
 */
export function startSpeedKitTest({
  url,
  isSpeedKitComparison,
  location,
  caching,
  whitelist,
  isMobile: mobile,
  activityTimeout = 75,
})  {
  const speedKitConfig = generateSpeedKitConfig(url, whitelist, mobile)
  return {
    'BAQEND': {
      types: [
        START_TEST_SPEED_KIT_POST_REQUEST,
        START_TEST_SPEED_KIT_POST_SUCCESS,
        START_TEST_SPEED_KIT_POST_FAILURE
      ],
      payload: (db) => db.modules.post('queueTest', {
        url,
        activityTimeout,
        isSpeedKitComparison,
        speedKitConfig,
        location,
        isClone: true,
        caching,
        mobile,
      })
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

// export const loadTestOverviewByTestId = (testId) => ({
//   'BAQEND': async ({ dispatch, getState, db }) => {
//     const options = { depth: 0 }
//     const result = await db.TestOverview.load(testId, options)
//     dispatch({
//       type: TESTOVERVIEW_LOAD,
//       payload: result,
//     }, options)
//   }
// })
//
// export const testAction = (json) => ({
//   'BAQEND': [ json, ({ dispatch, getState, db }, ref) => {
//     console.log(ref)
//   }]
// })

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
