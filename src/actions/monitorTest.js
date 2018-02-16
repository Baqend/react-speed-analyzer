import {
  RESET_TEST_RESULT,
  MONITOR_TEST,
  TESTOVERVIEW_SAVE,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_LOAD_FAIL,
  UPDATE_CONFIG,
  TEST_STATUS_GET,
  COMPETITOR_RESULT_NEXT,
  SPEED_KIT_RESULT_NEXT,
  TERMINATE_TEST,
} from './types'


export const resetTest = () => ({
  'BAQEND': async ({ dispatch }) => {
    dispatch({ type: RESET_TEST_RESULT })
  }
})

/**
 * Checks the status of a given test and subscribes to the result.
 * @param testId The id of the test to be monitored.
 */
export const monitorTest = (testId, bulkTest) => ({
  'BAQEND': async ({ dispatch }) => {
    dispatch({ type: MONITOR_TEST })

    let testOverview
    if (bulkTest) {
      testOverview = await dispatch(subscribeToTestOverview({ testId }))
    } else {
      testOverview = await dispatch(getTestOverview({ testId }))
    }
    const { competitorTestResult, speedKitTestResult } = testOverview

    dispatch(updateConfigByTestOverview(testOverview))

    if (testOverview.hasFinished) {
      dispatch(loadTestResults({ competitorTestResult, speedKitTestResult }))
    } else {
      const checkTestRunnterInterval = dispatch(checkTestStatus({ competitorTestResult }))
      dispatch(subscribeToTestResults({
        testOverview,
        competitorTestResult,
        speedKitTestResult,
        checkTestRunnterInterval
      }))
    }
  }
})

/**
 * Loads a given testOverview from the baqend database.
 * @param dispatch Method to dispatch an action input.
 * @param db The baqend database instance.
 * @param testId The id of the test to be loaded.
 */
const getTestOverview = ({ testId }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    let { testOverview } = getState().result
    if(Object.keys(testOverview).length === 0 || testOverview.id !== testId) {
      try {
        testOverview = await db.TestOverview.load(testId)
        dispatch({
          type: TESTOVERVIEW_LOAD,
          payload: testOverview
        })
        return testOverview.toJSON()
      } catch (e) {
        dispatch({
          type: TESTOVERVIEW_LOAD_FAIL,
          payload: e
        })
        throw e
      }
    }
    return testOverview
  }
})

const subscribeToTestOverview = ({ testId }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const testOverviewStream = db.TestOverview.find().equal('id', `/db/TestOverview/${testId}`).resultStream()
    return new Promise((resolve, reject) => {
      const testOverviewSubscription = testOverviewStream.subscribe((res) => {
        const testOverview = res[0] ? res[0].toJSON() : null
        if (testOverview) {
          dispatch({
            type: TESTOVERVIEW_LOAD,
            payload: testOverview
          })
          if (testOverview.hasFinished) {
            testOverviewSubscription && testOverviewSubscription.unsubscribe()
          }
          resolve(testOverview)
        }
      })
    })
  }
})

const updateConfigByTestOverview = (testOverview) => ({
  type: UPDATE_CONFIG,
  payload: {
    url: testOverview.url,
    location: testOverview.location,
    caching: testOverview.caching,
    isMobile: testOverview.mobile,
    activityTimeout: testOverview.activityTimeout,
    speedKitConfig: testOverview.speedKitConfig,
  }
})

const checkTestStatus = ({ competitorTestResult }) => ({
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
        const { statusCode } = await dispatch(pullTestStatus(competitorTestResult))
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

const loadTestResults = ({ competitorTestResult, speedKitTestResult }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const testResults = await Promise.all([
      db.TestResult.load(competitorTestResult),
      db.TestResult.load(speedKitTestResult)
    ])
    dispatch({
      type: COMPETITOR_RESULT_NEXT,
      payload: [testResults[0]]
    })
    dispatch({
      type: SPEED_KIT_RESULT_NEXT,
      payload: [testResults[1]]
    })
    dispatch({
      type: TERMINATE_TEST
    })
  }
})

const subscribeToTestResults = ({ testOverview, competitorTestResult, speedKitTestResult, checkTestRunnterInterval }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const competitorStream = db.TestResult.find().equal('id', competitorTestResult).resultStream()
    const speedKitStream = db.TestResult.find().equal('id', speedKitTestResult).resultStream()


    const competitorSubscription = competitorStream.subscribe((res) => {
      dispatch({
        type: COMPETITOR_RESULT_NEXT,
        payload: res
      })
      const competitorTest = res[0]
      if (competitorTest.hasFinished) {
        clearInterval(checkTestRunnterInterval)
        competitorSubscription && competitorSubscription.unsubscribe()
        dispatch(finalizeTestingProcess(testOverview))
      }
    })

    const speedKitSubscription = speedKitStream.subscribe((res) => {
      dispatch({
        type: SPEED_KIT_RESULT_NEXT,
        payload: res
      })
      const speedKitTest = res[0]
      if (speedKitTest.hasFinished) {
        speedKitSubscription && speedKitSubscription.unsubscribe()
        dispatch(finalizeTestingProcess(testOverview, checkTestRunnterInterval))
      }
    })
  }
})

const finalizeTestingProcess = (testOverviewObject) => ({
  'BAQEND': [testOverviewObject, async ({ dispatch, getState, db }, testOverview) => {
    const { competitorTest, speedKitTest } = getState().result
    if (competitorTest.hasFinished && speedKitTest.hasFinished && !testOverview.hasFinished) {
      try {
        const update = testOverview.partialUpdate().set('hasFinished', true)
        dispatch({
          type: TESTOVERVIEW_SAVE,
          payload: await update.execute()
        })
      } catch (e) {
        console.log(e)
      }
      dispatch({
        type: TERMINATE_TEST
      })
    }
  }]
})
