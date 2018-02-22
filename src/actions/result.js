import {
  RESET_TEST_RESULT,
  TESTOVERVIEW_LOAD,
  COMPETITOR_RESULT_LOAD,
  SPEED_KIT_RESULT_LOAD,
  TERMINATE_TEST,
} from './types'

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
      const { competitorTestResult, speedKitTestResult } = testOverview
      const testResults = await Promise.all([
        db.TestResult.load(competitorTestResult),
        db.TestResult.load(speedKitTestResult)
      ])
      dispatch({
        type: COMPETITOR_RESULT_LOAD,
        payload: testResults[0]
      })
      dispatch({
        type: SPEED_KIT_RESULT_LOAD,
        payload: testResults[1]
      })
      dispatch({
        type: TERMINATE_TEST
      })
    } catch(e) {
      throw new Error("Test Result could not be loaded")
    }
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
      dispatch({
        type: TESTOVERVIEW_LOAD,
        payload: testOverview
      })
      return testOverview.toJSON()
    }
    return testOverview
  }
})
