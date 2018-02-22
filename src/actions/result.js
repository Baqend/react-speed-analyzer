import {
  RESET_TEST_RESULT,
  MONITOR_TEST,
  TESTOVERVIEW_SAVE,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_NEXT,
  TESTOVERVIEW_LOAD_FAIL,
  UPDATE_CONFIG,
  TEST_STATUS_GET,
  COMPETITOR_RESULT_NEXT,
  SPEED_KIT_RESULT_NEXT,
  COMPETITOR_RESULT_LOAD,
  SPEED_KIT_RESULT_LOAD,
  TERMINATE_TEST,
} from './types'

import { updateConfigByTestOverview } from './config'


export const resetTest = () => ({
  'BAQEND': async ({ dispatch }) => {
    dispatch({ type: RESET_TEST_RESULT })
  }
})

/**
 * Checks the status of a given test and subscribes to the result.
 * @param testId The id of the test to be monitored.
 */
export const monitorTest = (testId, onAfterFinish) => ({
  'BAQEND': async ({ dispatch }) => {
    dispatch({ type: MONITOR_TEST })
    const testOverview = await dispatch(subscribeToTestOverview({ testId, onAfterFinish }))
    // dispatch(updateConfigByTestOverview(testOverview))
    if (!testOverview.hasFinished) {
      dispatch(checkTestStatus(testOverview.competitorTestResult))
    }
  }
})

const subscribeToTestOverview = ({ testId, onAfterFinish }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    let isResolved = false
    const testOverviewStream = db.TestOverview.find().equal('id', `/db/TestOverview/${testId}`).resultStream()
    const testOverviewPromise = new Promise((resolve, reject) => {
      const testOverviewSubscription = testOverviewStream.subscribe((res) => {
        const testOverview = res[0] ? res[0].toJSON() : null
        if (testOverview) {
          if (testOverview.hasFinished) {
            testOverviewSubscription && testOverviewSubscription.unsubscribe()
            onAfterFinish && onAfterFinish({ testId })
          }
          if (isResolved) {
            dispatch({
              type: TESTOVERVIEW_NEXT,
              payload: testOverview
            })
          } else {
            dispatch({
              type: TESTOVERVIEW_LOAD,
              payload: testOverview
            })
          }
          testOverviewPromise.then((testOverview) => {
            isResolved = true
          })
          resolve(testOverview)
        }
      })
    })
    return testOverviewPromise
  }
})

const checkTestStatus = (testId) => ({
  'BAQEND': ({ dispatch, getState, db }) => {
    const pullTestStatus = (id) => ({
      'BAQEND': async ({ dispatch, db }) => {
        const res = await db.modules.get('getTestStatus', { baqendId: id })
        const status = {
          statusCode: res.status.statusCode,
          statusText: res.status.statusText
        }
        dispatch({
          type: TEST_STATUS_GET,
          payload: status
        })
        return status
      }
    })
    const interval = setInterval(async () => {
      try {
        const { statusCode } = await dispatch(pullTestStatus(testId))
        if (statusCode === 100 || statusCode === 200) {
          clearInterval(interval)
        }
      } catch (e) {
        clearInterval(interval)
      }
    }, 2000)
    return interval
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

export const loadTest = (testId) => ({
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
