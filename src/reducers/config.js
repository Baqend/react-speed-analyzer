import { CHANGE_URL, CHANGE_LOCATION, SWITCH_MOBILE, SWITCH_CACHING, FETCH_POSTS_SUCCESS } from '../actions/types'

const initialState = {
  url: '',
  location: 'eu-central-1:Chrome.Native',
  caching: false,
  mobile: false,
}

export default function config(state = initialState, action = {}) {
  console.log(action.payload);
  switch (action.type) {
    case CHANGE_URL:
      return { ...state, url: action.payload }
    case CHANGE_LOCATION:
      return { ...state, location: action.payload }
    case SWITCH_MOBILE:
      return { ...state, mobile: action.payload }
    case SWITCH_CACHING:
      return { ...state, caching: action.payload }
    case FETCH_POSTS_SUCCESS:
      return { ...state, url: action.payload[0].url }
    default:
      return state
  }
}
