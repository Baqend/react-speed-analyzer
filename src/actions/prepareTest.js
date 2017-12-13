import {
  NORMALIZE_URL_POST_REQUEST,
  NORMALIZE_URL_POST_SUCCESS,
  NORMALIZE_URL_POST_FAILURE,
  RATE_LIMITER_GET_REQUEST,
  RATE_LIMITER_GET_SUCCESS,
  RATE_LIMITER_GET_FAILURE
} from './types'

export function normalizeUrl(url, mobile) {
  return {
    'BAQEND': {
      types: [
        NORMALIZE_URL_POST_REQUEST,
        NORMALIZE_URL_POST_SUCCESS,
        NORMALIZE_URL_POST_FAILURE
      ],
      payload: (db) => db.modules.post('normalizeUrl', { urls: url, mobile })
    }
  }
}

export function checkRateLimit() {
  return {
    'BAQEND': {
      types: [
        RATE_LIMITER_GET_REQUEST,
        RATE_LIMITER_GET_SUCCESS,
        RATE_LIMITER_GET_FAILURE
      ],
      payload: (db) => db.modules.get('rateLimiter')
    }
  }
}
