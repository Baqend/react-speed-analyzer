import {
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_SAVE,
  RATE_LIMITER_GET,
  NORMALIZE_URL_POST,
  START_TEST_COMPETITOR_POST,
  START_TEST_SPEED_KIT_POST,
  TEST_STATUS_GET_SUCCESS,
  COMPETITOR_RESULT_NEXT,
  SPEED_KIT_RESULT_NEXT,
  COMPETITOR_RESULT_NEXT_SUBSCRIPTION,
  SPEED_KIT_RESULT_NEXT_SUBSCRIPTION,
  TERMINATE_TEST,
} from '../actions/types'

const initialState = {
  isRateLimited: false,
  isBaqendApp: false,
  testOverview: null,
  statusCode: null,
  statusText: '',
  competitorSubscription: null,
  speedKitSubscription: null,
  competitorTest: null,
  speedKitTest: null,
  testRunning: false,
  testFinished: false,
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
    case TEST_STATUS_GET_SUCCESS:
      return { ...state, statusCode: action.payload.statusCode, statusText: action.payload.statusText  }
    case COMPETITOR_RESULT_NEXT:
      return { ...state, competitorTest: action.payload[0] }
    case SPEED_KIT_RESULT_NEXT:
      return { ...state, speedKitTest: action.payload[0] }
    case COMPETITOR_RESULT_NEXT_SUBSCRIPTION:
      return { ...state, competitorSubscription: action.payload }
    case SPEED_KIT_RESULT_NEXT_SUBSCRIPTION:
      return { ...state, speedKitSubscription: action.payload }
    case TERMINATE_TEST:
      if(state.competitorSubscription) {
        state.competitorSubscription.unsubscribe()
      }
      if(state.speedKitSubscription) {
        state.speedKitSubscription.unsubscribe()
      }
      return {
        ...state, competitorSubscription: null, speedKitSubscription: null, testRunning: false, testFinished: true
      }
    default:
      return state
  }
}
