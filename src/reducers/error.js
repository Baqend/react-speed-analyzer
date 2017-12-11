import {
  RATE_LIMITER_GET_SUCCESS,
  NORMALIZE_URL_POST_SUCCESS
} from '../actions/types'

const initialState = {
  isRateLimited: false,
  isBaqendApp: false
}

export default function config(state = initialState, action = {}) {
  switch (action.type) {
    case RATE_LIMITER_GET_SUCCESS:
      return { ...state, isRateLimited: action.payload.isRateLimited }
    case NORMALIZE_URL_POST_SUCCESS:
      return { ...state, isBaqendApp: action.payload[0].isBaqendApp }
    default:
      return state
  }
}
