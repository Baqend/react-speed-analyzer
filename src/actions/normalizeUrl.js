import { NORMALIZE_URL_POST_REQUEST, NORMALIZE_URL_POST_SUCCESS, NORMALIZE_URL_POST_FAILURE} from './types'

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

