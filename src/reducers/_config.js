import {
  RESET_CONFIG,
  CHANGE_URL,
  CHANGE_LOCATION,
  CHANGE_TIMEOUT,
  CHANGE_SPEED_KIT_CONFIG,
  SWITCH_MOBILE,
  SWITCH_CACHING,
  START_TEST_POST,
  TESTOVERVIEW_LOAD,
} from '../actions/types'

const initialState = {
  url: '',
  location: 'eu-central-1:Chrome.Native',
  caching: false,
  mobile: false,
  isSpeedKitComparison: false,
  speedKitConfig: null,
  activityTimeout: 75,
}

export default function config(state = initialState, action = {}) {
  switch (action.type) {
    case RESET_CONFIG:
      return { ...initialState }
    case CHANGE_URL:
      return { ...state, url: action.payload }
    case CHANGE_LOCATION:
      return { ...state, location: action.payload }
    case CHANGE_TIMEOUT:
      return { ...state, activityTimeout: action.payload }
    case CHANGE_SPEED_KIT_CONFIG:
      return { ...state, speedKitConfig: action.payload }
    case SWITCH_MOBILE:
      return { ...state, mobile: action.payload }
    case SWITCH_CACHING:
      return { ...state, caching: action.payload }
    case START_TEST_POST:
      return { ...state, url: action.payload.displayUrl, isSpeedKitComparison: action.payload.isSpeedKitComparison }
    case TESTOVERVIEW_LOAD:
      return {
        ...state,
        url: action.payload.url || state.url,
        location: action.payload.location || state.location,
        caching: action.payload.caching || state.caching,
        mobile: action.payload.mobile || state.mobile,
        activityTimeout: action.payload.activityTimeout || state.activityTimeout,
        speedKitConfig: action.payload.speedKitConfig || state.speedKitConfig,
      }
    default:
      return state
  }
}
