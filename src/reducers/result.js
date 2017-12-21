import {
  TESTOVERVIEW_CREATE,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_SAVE,
  RATE_LIMITER_GET_SUCCESS,
  NORMALIZE_URL_POST_SUCCESS,
  START_TEST_COMPETITOR_POST_SUCCESS,
  START_TEST_SPEED_KIT_POST_SUCCESS,
  TEST_STATUS_GET_SUCCESS,
  COMPETITOR_RESULT_NEXT,
  SPEED_KIT_RESULT_NEXT
} from '../actions/types'

const initialState = {
  isRateLimited: false,
  isBaqendApp: false,
  testOverview: null,
  statusCode: null,
  statusText: '',
  competitorTest: null,
  speedKitTest: null,
  testRunning: false,
  testFinished: false,
}

export default function result(state = initialState, action = {}) {
  switch (action.type) {
    case TESTOVERVIEW_CREATE:
      return { ...state, testOverview: action.payload, testRunning: true, testFinished: false }
    case TESTOVERVIEW_LOAD:
      return { ...state, testOverview: action.payload }
    case TESTOVERVIEW_SAVE:
      return { ...state, testOverview: action.payload }
    case RATE_LIMITER_GET_SUCCESS:
      return { ...state, isRateLimited: action.payload.isRateLimited }
    case NORMALIZE_URL_POST_SUCCESS:
      return { ...state, isBaqendApp: action.payload[0].isBaqendApp }
    case START_TEST_COMPETITOR_POST_SUCCESS:
      return {
        ...state, testOverview: {
          ...state.testOverview, competitorTestResult: `/db/TestResult/${action.payload.baqendId }`
        }
      }
    case START_TEST_SPEED_KIT_POST_SUCCESS:
      return {
        ...state, testOverview: {
          ...state.testOverview, speedKitTestResult: `/db/TestResult/${action.payload.baqendId }`
        }
      }
    case TEST_STATUS_GET_SUCCESS:
      return { ...state, statusCode: action.payload.statusCode, statusText: action.payload.statusText  }
    case COMPETITOR_RESULT_NEXT:
      return { ...state, competitorTest: action.payload[0] }
    case SPEED_KIT_RESULT_NEXT:
      return { ...state, speedKitTest: action.payload[0] }
    default:
      return state
  }
}
