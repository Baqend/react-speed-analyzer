import { RATE_LIMITER_GET_REQUEST, RATE_LIMITER_GET_SUCCESS, RATE_LIMITER_GET_FAILURE } from './types'

export function testRateLimit() {
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
