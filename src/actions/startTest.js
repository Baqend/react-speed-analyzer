import {
  TESTOVERVIEW_CREATE,
  START_TEST_COMPETITOR_POST_REQUEST,
  START_TEST_COMPETITOR_POST_SUCCESS,
  START_TEST_COMPETITOR_POST_FAILURE,
  START_TEST_SPEED_KIT_POST_REQUEST,
  START_TEST_SPEED_KIT_POST_SUCCESS,
  START_TEST_SPEED_KIT_POST_FAILURE,
  COMPETITOR_RESULT_NEXT
} from './types'

import { generateSpeedKitConfig } from '../helper/configHelper'
import { getTLD } from '../helper/configHelper'

/**
 * Create a new testOverview object with uniqueId based on the url.
 * @param url The url to be tested.
 * @param caching A flag to detect whether to use caching or not.
 * @param isMobile A flag to detect whether it i a mobile website or not.
 * @param whitelist A comma separated list of strings.
 */
export function createTestOverview({ url, caching, isMobile, whitelist }) {
  return {
    'BAQEND': {
      type: TESTOVERVIEW_CREATE,
      payload: async (db) => {
        const testOverview = new db.TestOverview()
        const tld = getTLD(url)
        const uniqueId = await db.modules.post('generateUniqueId', { entityClass: 'TestOverview' })
        testOverview.id = uniqueId + tld.substring(0, tld.length - 1)
        testOverview.url = url
        testOverview.caching = caching
        testOverview.mobile = isMobile
        testOverview.whitelist = whitelist
        return testOverview.save()
      },
    },
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
 * @param competitorBaqendId The id of the test to subscribe on.
 */
export function subscribeOnCompetitorTestResult(competitorBaqendId) {
  return {
    'BAQEND': {
      type: COMPETITOR_RESULT_NEXT,
      payload: (db) => db.TestResult.find().equal('id', `/db/TestResult/${competitorBaqendId}`).resultStream()
    }
  }
}
