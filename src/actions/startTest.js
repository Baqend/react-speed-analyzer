import {
  START_TEST_COMPETITOR_POST_REQUEST,
  START_TEST_COMPETITOR_POST_SUCCESS,
  START_TEST_COMPETITOR_POST_FAILURE,
  START_TEST_SPEED_KIT_POST_REQUEST,
  START_TEST_SPEED_KIT_POST_SUCCESS,
  START_TEST_SPEED_KIT_POST_FAILURE
} from './types'

export function startCompetitorTest(
  competitorUrl,
  isSpeedKitComparison,
  location,
  caching,
  isMobile,
  activityTimeout = 75) {
  return {
    'BAQEND': {
      types: [
        START_TEST_COMPETITOR_POST_REQUEST,
        START_TEST_COMPETITOR_POST_SUCCESS,
        START_TEST_COMPETITOR_POST_FAILURE
      ],
      payload: (db) => db.modules.post('queueTest', {
        url: competitorUrl,
        activityTimeout,
        isSpeedKitComparison,
        location,
        isClone: false,
        caching,
        mobile: isMobile,
      })
    },
  }
}

export function startSpeedKitTest(
  competitorUrl,
  isSpeedKitComparison,
  speedKitConfig,
  location,
  caching,
  isMobile,
  activityTimeout = 75) {
  return {
    'BAQEND': {
      types: [
        START_TEST_SPEED_KIT_POST_REQUEST,
        START_TEST_SPEED_KIT_POST_SUCCESS,
        START_TEST_SPEED_KIT_POST_FAILURE
      ],
      payload: (db) => db.modules.post('queueTest', {
        url: competitorUrl,
        activityTimeout,
        isSpeedKitComparison,
        speedKitConfig,
        location,
        isClone: true,
        caching,
        mobile: isMobile,
      })
    },
  }
}
