import {
  RESET_CONFIG,
  CHANGE_URL,
  CHANGE_LOCATION,
  CHANGE_TIMEOUT,
  CHANGE_SPEED_KIT_CONFIG,
  CHANGE_COOKIE,
  SWITCH_MOBILE,
  SWITCH_CACHING,
  TESTOVERVIEW_LOAD, COMPETITOR_RESULT_LOAD,
} from '../actions/types'

const initialState = {
  url: '',
  location: 'eu-central-1-docker:Chrome.FIOSNoLatency',
  caching: false,
  mobile: false,
  isSpeedKitComparison: false,
  speedKitConfig: null,
  activityTimeout: 75,
  cookie: '',
}

const ensureLocationCorrectness = (location) => {
  if (location === 'eu-central-1:Chrome.Native') {
    return 'eu-central-1-docker:Chrome.FIOSNoLatency'
  }

  if (location === 'us-east-1:Chrome.Native') {
    return 'us-east-1-docker:Chrome.FIOSNoLatency'
  }

  return location
}


export default function config(state = initialState, action = {}) {
  switch (action.type) {
    case RESET_CONFIG:
      return { ...initialState }
    case CHANGE_URL:
      return { ...state, url: action.payload }
    case CHANGE_LOCATION:
      return {
        ...state,
        location: state.mobile ? action.payload.substr(0, action.payload.lastIndexOf('.') + 1) + 'LTE' : action.payload
      }
    case CHANGE_TIMEOUT:
      return { ...state, activityTimeout: action.payload }
    case CHANGE_SPEED_KIT_CONFIG:
      return { ...state, speedKitConfig: action.payload }
    case CHANGE_COOKIE:
      return { ...state, cookie: action.payload }
    case SWITCH_MOBILE:
      const mobile = action.payload
      const location = state.location.substr(0, state.location.lastIndexOf('.') + 1)
      return {
        ...state,
        mobile,
        location: mobile ? location + 'LTE' : location + 'FIOSNoLatency',
      }
    case SWITCH_CACHING:
      return { ...state, caching: action.payload }
    case COMPETITOR_RESULT_LOAD:
      return { ...state, cookie: action.payload.testInfo.cookie }
    case TESTOVERVIEW_LOAD:
      return {
        ...state,
        url: action.payload.url || state.url,
        location: action.payload.location ? ensureLocationCorrectness(action.payload.location) : state.location,
        caching: action.payload.caching || state.caching,
        mobile: action.payload.mobile || state.mobile,
        activityTimeout: action.payload.activityTimeout || state.activityTimeout,
        speedKitConfig: action.payload.speedKitConfig || state.speedKitConfig,
      }
    default:
      return state
  }
}
