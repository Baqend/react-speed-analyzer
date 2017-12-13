import {
  CHANGE_URL,
  CHANGE_LOCATION,
  CHANGE_WHITELIST,
  SWITCH_MOBILE,
  SWITCH_CACHING,
  NORMALIZE_URL_POST_SUCCESS
} from '../actions/types'

const initialState = {
  url: '',
  location: 'eu-central-1:Chrome.Native',
  caching: false,
  isMobile: false,
  whitelist: '',
  isSpeedKitComparison: false,
}

export default function config(state = initialState, action = {}) {
  switch (action.type) {
    case CHANGE_URL:
      return { ...state, url: action.payload }
    case CHANGE_LOCATION:
      return { ...state, location: action.payload }
    case CHANGE_WHITELIST:
      return { ...state, whitelist: action.whitelist }
    case SWITCH_MOBILE:
      return { ...state, isMobile: action.payload }
    case SWITCH_CACHING:
      return { ...state, caching: action.payload }
    case NORMALIZE_URL_POST_SUCCESS:
      return { ...state, url: action.payload[0].url, isSpeedKitComparison: action.payload[0].isSpeedKitComparison }
    default:
      return state
  }
}
