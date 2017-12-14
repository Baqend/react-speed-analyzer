import {
  NORMALIZE_URL_POST_REQUEST,
  NORMALIZE_URL_POST_SUCCESS,
  NORMALIZE_URL_POST_FAILURE,
  RATE_LIMITER_GET_REQUEST,
  RATE_LIMITER_GET_SUCCESS,
  RATE_LIMITER_GET_FAILURE
} from './types'

/**
 * Normalize a url and get further information (is baqend app etc.) of the website.
 * @param url The url to be normalized.
 * @param mobile A flag to detect whether it i a mobile website or not.
 */
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
/**
 * Check whether the user is rate limited or not.
 */
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
