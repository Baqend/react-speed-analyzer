import {
  RESET_TEST_RESULT,
  START_TEST,
  CONTINUE_TEST,
  MONITOR_TEST,
  TESTOVERVIEW_SAVE,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_LOAD_FAIL,
  UPDATE_CONFIG,
  TEST_STATUS_GET,
  COMPETITOR_RESULT_NEXT,
  COMPETITOR_SUBSCRIPTION,
  SPEED_KIT_RESULT_NEXT,
  SPEED_KIT_SUBSCRIPTION,
  TERMINATE_TEST,
  ADD_ERROR
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
export const monitorTest = (testId) => ({
  'BAQEND': async ({ dispatch }) => {
    dispatch({ type: MONITOR_TEST })
    // dispatch({ type: CONTINUE_TEST })
    // try {
    //   throw new Error("Lol, so geht das doch nicht")
    // } catch (e) {
    //   dispatch({
    //     type: ADD_ERROR,
    //     payload: e
    //   })
    //   setTimeout(() => {
    //     try {
    //       throw new Error("Lol, immer noch nicht")
    //     } catch (e) {
    //       dispatch({
    //         type: ADD_ERROR,
    //         payload: e
    //       })
    //     }
    //   }, 3000)
    // }

    const testOverview = await dispatch(getTestOverview({ testId }))
    const { competitorTestResult, speedKitTestResult } = testOverview

    dispatch(updateConfigByTestOverview(testOverview))

    if (testOverview.hasFinished) {
      dispatch(loadTestResults({ competitorTestResult, speedKitTestResult }))
    } else {
      dispatch(checkTestStatus({ competitorTestResult }))
      dispatch(subscribeToTestResults({ testOverview, competitorTestResult, speedKitTestResult }))
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

const subscribeToTestResults = ({ testOverview, competitorTestResult, speedKitTestResult }) => ({
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
        dispatch(finalizeTestingProcess(testOverview))
      }
    })
  }
})

const finalizeTestingProcess = (testOverviewObject) => ({
  'BAQEND': [testOverviewObject, async ({ dispatch, getState, db }, testOverview) => {
    const { competitorTest, speedKitTest } = getState().result
    if (competitorTest.hasFinished && speedKitTest.hasFinished) {
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
