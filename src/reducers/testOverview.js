import {
  TESTOVERVIEW_CREATE,
  TESTOVERVIEW_SAVE,
  TESTOVERVIEW_UPDATE_URL,
  TESTOVERVIEW_UPDATE_CACHING,
  TESTOVERVIEW_UPDATE_IS_MOBILE,
  TESTOVERVIEW_UPDATE_WHITELIST
} from '../actions/types'

const initialState = {
  testOverview: {}
}

export default function testOverview(state = initialState, action = {}) {
  switch (action.type) {
    case TESTOVERVIEW_CREATE || TESTOVERVIEW_SAVE:
      return { ...state, testOverview: action.payload }
    case TESTOVERVIEW_UPDATE_URL:
      return { ...state, testOverview: { ...state.testOverview, url: action.payload } }
    case TESTOVERVIEW_UPDATE_CACHING:
      return { ...state, testOverview: { ...state.testOverview, caching: action.payload } }
    case TESTOVERVIEW_UPDATE_IS_MOBILE:
      return { ...state, testOverview: { ...state.testOverview, mobile: action.payload } }
    case TESTOVERVIEW_UPDATE_WHITELIST:
      return { ...state, testOverview: { ...state.testOverview, whitelist: action.payload } }
    default:
      return state
  }
}
