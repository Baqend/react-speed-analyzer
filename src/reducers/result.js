import {
  INIT_TEST,
  START_TEST,
  CONTINUE_TEST,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_SAVE,
  RATE_LIMITER_GET,
  NORMALIZE_URL_POST,
  START_TEST_COMPETITOR_POST,
  START_TEST_SPEED_KIT_POST,
  TEST_STATUS_GET,
  COMPETITOR_RESULT_NEXT,
  SPEED_KIT_RESULT_NEXT,
  COMPETITOR_SUBSCRIPTION,
  SPEED_KIT_SUBSCRIPTION,
  TERMINATE_TEST,
  RESET_TEST_RESULT,
} from '../actions/types'

const initialState = {
  isInitiated: false,
  isStarted: false,
  isRateLimited: false,
  isBaqendApp: false,
  testOverview: {},
  statusCode: null,
  statusText: '',
  competitorSubscription: null,
  speedKitSubscription: null,
  competitorTest: {},
  speedKitTest: {},
}

export default function result(state = initialState, action = {}) {
  switch (action.type) {
    case TESTOVERVIEW_LOAD:
      return { ...state, testOverview: action.payload }
    case TESTOVERVIEW_SAVE:
      return { ...state, testOverview: action.payload }
    case RATE_LIMITER_GET:
      return { ...state, isRateLimited: action.payload }
    case NORMALIZE_URL_POST:
      return { ...state, isBaqendApp: action.payload.isBaqendApp }
    case INIT_TEST:
      return { ...state, isInitiated: true }
    case START_TEST:
      return { ...state, isStarted: true }
    case CONTINUE_TEST:
      return { ...state, isInitiated: true, isStarted: true }
    case START_TEST_COMPETITOR_POST:
      return {
        ...state, testOverview: {
          ...state.testOverview, competitorTestResult: `/db/TestResult/${action.payload.baqendId }`
        }
      }
    case START_TEST_SPEED_KIT_POST:
      return {
        ...state, testOverview: {
          ...state.testOverview, speedKitTestResult: `/db/TestResult/${action.payload.baqendId }`
        }
      }
    case TEST_STATUS_GET:
      return { ...state, statusCode: action.payload.statusCode, statusText: action.payload.statusText  }
    case COMPETITOR_RESULT_NEXT:
      const competitorTest = action.payload[0] ? action.payload[0] : {}
      return { ...state, competitorTest }
    case SPEED_KIT_RESULT_NEXT:
      const speedKitTest = action.payload[0] ? action.payload[0] : {}
      return { ...state, speedKitTest }
    case COMPETITOR_SUBSCRIPTION:
      return { ...state, competitorSubscription: action.payload }
    case SPEED_KIT_SUBSCRIPTION:
      return { ...state, speedKitSubscription: action.payload }
    case TERMINATE_TEST:
      return {
        ...state, competitorSubscription: null, speedKitSubscription: null
      }
    case RESET_TEST_RESULT:
      return { ...initialState }
    default:
      return state
  }
}
