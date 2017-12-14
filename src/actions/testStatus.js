import {
  TEST_STATUS_GET_REQUEST,
  TEST_STATUS_GET_SUCCESS,
  TEST_STATUS_GET_FAILURE,
} from './types'

/**
 * Get the status of a given test by its id.
 * @param baqendId The id of the test object to get the status from.
 */
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
