import {
  TEST_STATUS_GET_REQUEST,
  TEST_STATUS_GET_SUCCESS,
  TEST_STATUS_GET_FAILURE,
} from './types'


export function getTestStatus(baqendId) {
  return {
    'BAQEND': {
      types: [
        TEST_STATUS_GET_REQUEST,
        TEST_STATUS_GET_SUCCESS,
        TEST_STATUS_GET_FAILURE
      ],
      payload: async (db) => {
        const res = await db.modules.get('getTestStatus', { baqendId })
        const status = res.status
        return { statusCode: status.statusCode, statusText: status.statusText }
      }
    }
  }
}
