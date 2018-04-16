import {
  RESET_TEST_STATUS,
  RESET_TEST_RESULT,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_LOAD_FAIL,
  COMPETITOR_RESULT_LOAD,
  SPEED_KIT_RESULT_LOAD,
  TERMINATE_TEST,
} from './types'
import { trackURL } from '../helper/utils'

export const resetTestStatus = () => ({
  type: RESET_TEST_STATUS
})

export const resetResult = () => ({
  'BAQEND': async ({ dispatch }) => {
    dispatch({ type: RESET_TEST_RESULT })
  }
})

export const loadResult = (testId) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    let testOverview
    try {
      testOverview = await dispatch(getTestOverview(testId))
      const { competitorTestOverview, speedKitTestOverview } = testOverview
      const [competitorTestResult, speedKitTestResult] = await Promise.all([
        db.TestResult.load(competitorTestOverview),
        db.TestResult.load(speedKitTestOverview)
      ])

      if (speedKitTestResult) {
        trackURL('showTestResult', speedKitTestResult.url, speedKitTestOverview.factors)
      } else {
        trackURL('errorTestResult', speedKitTestResult.url)
      }

      dispatch({
        type: COMPETITOR_RESULT_LOAD,
        payload: competitorTestResult
      })
      dispatch({
        type: SPEED_KIT_RESULT_LOAD,
        payload: speedKitTestResult
      })
      dispatch({
        type: TERMINATE_TEST
      })
    } catch(e) {
      throw new Error("Test Result could not be loaded")
    }
    return testOverview
  }
})

/**
 * Loads a given testOverview from the baqend database.
 * @param dispatch Method to dispatch an action input.
 * @param db The baqend database instance.
 * @param testId The id of the test to be loaded.
 */
const getTestOverview = (testId) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    let { testOverview } = getState().result
    if(Object.keys(testOverview).length === 0 || testOverview.id !== testId) {
      testOverview = await db.TestOverview.load(testId)
      if (testOverview) {
        dispatch({
          type: TESTOVERVIEW_LOAD,
          payload: testOverview
        })
        return testOverview.toJSON()
      } else {
        dispatch({
          type: TESTOVERVIEW_LOAD_FAIL,
          payload: null,
        })
        return null
      }
    }
    return testOverview
  }
})
