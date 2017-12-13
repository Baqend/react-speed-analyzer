import {
  TESTOVERVIEW_CREATE,
  RATE_LIMITER_GET_SUCCESS,
  NORMALIZE_URL_POST_SUCCESS,
  START_TEST_COMPETITOR_POST_SUCCESS,
  START_TEST_SPEED_KIT_POST_SUCCESS,
  TEST_STATUS_GET_SUCCESS
} from '../actions/types'

const initialState = {
  isRateLimited: false,
  isBaqendApp: false,
  testOverview: {},
  running: false,
  statusCode: null,
  statusText: '',
  competitorTest: {
    id: null
  },
  speedKitTest: {
    id: null
  }
}

export default function result(state = initialState, action = {}) {
  switch (action.type) {
    case TESTOVERVIEW_CREATE:
      return { ...state, testOverview: action.payload, running: true }
    case RATE_LIMITER_GET_SUCCESS:
      return { ...state, isRateLimited: action.payload.isRateLimited }
    case NORMALIZE_URL_POST_SUCCESS:
      return { ...state, isBaqendApp: action.payload[0].isBaqendApp }
    case START_TEST_COMPETITOR_POST_SUCCESS:
      return { ...state, competitorTest: { id: action.payload.baqendId } }
    case START_TEST_SPEED_KIT_POST_SUCCESS:
      return { ...state, speedKitTest: { id: action.payload.baqendId } }
    case TEST_STATUS_GET_SUCCESS:
      return { ...state, statusCode: action.payload.statusCode, statusText: action.payload.statusText  }
    default:
      return state
  }
}
