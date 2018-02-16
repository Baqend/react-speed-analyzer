import {
  RESET_CONFIG,
  CHANGE_URL,
  CHANGE_LOCATION,
  CHANGE_TIMEOUT,
  CHANGE_SPEED_KIT_CONFIG,
  SWITCH_MOBILE,
  SWITCH_CACHING,
  NORMALIZE_URL_POST,
  UPDATE_CONFIG
} from '../actions/types'

const initialState = {
  url: '',
  location: 'eu-central-1:Chrome.Native',
  caching: false,
  isMobile: false,
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
      return { ...state, isMobile: action.payload }
    case SWITCH_CACHING:
      return { ...state, caching: action.payload }
    case NORMALIZE_URL_POST:
      return { ...state, url: action.payload.url, isSpeedKitComparison: action.payload.isSpeedKitComparison }
    case UPDATE_CONFIG:
      return {
        ...state, url: action.payload.url, location: action.payload.location,
        caching: action.payload.caching, isMobile: action.payload.isMobile,
        activityTimeout: action.payload.activityTimeout, speedKitConfig: action.payload.speedKitConfig
      }
    default:
      return state
  }
}
