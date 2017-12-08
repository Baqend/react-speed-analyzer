import { CHANGE_URL, CHANGE_LOCATION, SWITCH_MOBILE } from '../actions/types'

const initialState = {
  url: '',
  location: 'eu-central-1:Chrome.Native',
  caching: false,
  mobile: false,
}

export default function config(state = initialState, action = {}) {
  switch (action.type) {
    case CHANGE_URL:
      return { ...state, url: action.payload }
    case CHANGE_LOCATION:
      return { ...state, location: action.payload }
    case SWITCH_MOBILE:
      return { ...state, mobile: !action.payload }
    default:
      return state
  }
}
