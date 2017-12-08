import { FETCH_POSTS_REQUEST, FETCH_POSTS_SUCCESS, FETCH_POSTS_FAILURE } from './types'

export function normalizeUrl(url, mobile) {
  return {
    'BAQEND': {
      types: [
        FETCH_POSTS_REQUEST,
        FETCH_POSTS_SUCCESS,
        FETCH_POSTS_FAILURE
      ],
      payload: (db) => db.modules.post('normalizeUrl', { urls: url, mobile })
    }
  }
}
