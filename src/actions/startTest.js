import {
  TESTOVERVIEW_CREATE,
  START_TEST_COMPETITOR_POST_REQUEST,
  START_TEST_COMPETITOR_POST_SUCCESS,
  START_TEST_COMPETITOR_POST_FAILURE,
  START_TEST_SPEED_KIT_POST_REQUEST,
  START_TEST_SPEED_KIT_POST_SUCCESS,
  START_TEST_SPEED_KIT_POST_FAILURE
} from './types'

import { generateSpeedKitConfig } from '../helper/configHelper'
import { getTLD } from '../helper/configHelper'

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
