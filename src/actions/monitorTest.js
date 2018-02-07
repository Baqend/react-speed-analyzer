import {
  RESET_TEST_RESULT,
  CONTINUE_TEST,
  MONITOR_TEST,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_LOAD_FAIL,
  UPDATE_CONFIG,
  TEST_STATUS_GET,
  COMPETITOR_RESULT_NEXT,
  COMPETITOR_SUBSCRIPTION,
  SPEED_KIT_RESULT_NEXT,
  SPEED_KIT_SUBSCRIPTION,
  TERMINATE_TEST
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
  'BAQEND': async (store) => {
    const { dispatch, getState, db } = store

    dispatch({ type: MONITOR_TEST })
    dispatch({ type: CONTINUE_TEST })

    let { testOverview } = getState().result
    if(Object.keys(testOverview).length === 0) {
      try {
        await loadTestOverviewByTestId({ ...store, testId})
        testOverview = getState().result.testOverview
      } catch (e) {
        throw e
      }
    }

    dispatch(updateConfigByTestOverview(testOverview))

    const competitorBaqendId = testOverview.competitorTestResult
    const speedKitBaqendId = testOverview.speedKitTestResult
    // debugger
    if (testOverview.hasFinished) {
      loadTestResults({ ...store, competitorBaqendId, speedKitBaqendId })
    } else {
      checkTestStatus({ ...store, competitorBaqendId })
      subscribeOnCompetitorTest({ ...store, competitorBaqendId})
      subscribeOnSpeedKitTest({ ...store, speedKitBaqendId})
    }
  }
})

/**
 * Loads a given testOverview from the baqend database.
 * @param dispatch Method to dispatch an action input.
 * @param db The baqend database instance.
 * @param testId The id of the test to be loaded.
 */
const loadTestOverviewByTestId = async ({ dispatch, db, testId }) => {
  try {
    const testOverview = await db.TestOverview.load(testId)
    dispatch({
      type: TESTOVERVIEW_LOAD,
      payload: testOverview
    })
    return testOverview
  } catch (e) {
    dispatch({
      type: TESTOVERVIEW_LOAD_FAIL,
      payload: e
    })
    throw e
  }
}

/**
 * Checks the status of a given test in an interval of 2 seconds.
 * @param dispatch Method to dispatch an action input.
 * @param getState Method to get the state of the redux store.
 * @param db The baqend database instance.
 * @param competitorBaqendId The competitor test id to get the status for.
 */
const checkTestStatus = ({ dispatch, getState, db, competitorBaqendId }) => {
  console.log("checkTestStatus")
  const interval = setInterval(() => {
    getTestStatus({ dispatch, getState, db, competitorBaqendId })
      .then(() => {
        const { statusCode } = getState().result
        if (statusCode === 100 || statusCode === 200) {
          clearInterval(interval)
        }
      }).catch(e => clearInterval(interval))
  }, 2000,
  )
}

/**
 * Gets the status of the given test id.
 * @param dispatch Method to dispatch an action input.
 * @param db The baqend database instance.
 * @param competitorBaqendId The competitor test id to get the status for.
 */
const getTestStatus = async ({ dispatch, db, competitorBaqendId }) => {
  console.log("getTestStatus")
  const res = await db.modules.get('getTestStatus', { baqendId: competitorBaqendId })
  const status = { statusCode: res.status.statusCode, statusText: res.status.statusText }
  dispatch({
    type: TEST_STATUS_GET,
    payload: status
  })
}

/**
 * Updates the config parameters based on the given testOverview.
 * @param testOverview The testOverview object with the up-to-date config.
 */
const updateConfigByTestOverview = (testOverview) => {
  return {
    type: UPDATE_CONFIG,
    payload: {
      url: testOverview.url,
      location: testOverview.location,
      caching: testOverview.caching,
      isMobile: testOverview.mobile,
      activityTimeout: testOverview.activityTimeout,
      speedKitConfig: testOverview.speedKitConfig,
    }
  }
}

/**
 * Subscribes on the result of the given competitor baqend id
 * @param dispatch Method to dispatch an action input.
 * @param db The baqend database instance.
 * @param competitorBaqendId The competitor baqend id to subscribe on.
 */
const subscribeOnCompetitorTest = ({ dispatch, getState, db, competitorBaqendId }) => {
  const callback = (r) => {
    dispatch({
      type: COMPETITOR_RESULT_NEXT,
      payload: r
    })
    checkTestFinishState({ dispatch, getState })
  }

  const subscription = db.TestResult.find().equal('id', competitorBaqendId).resultStream().subscribe(callback)
  dispatch({
    type: COMPETITOR_SUBSCRIPTION,
    payload: subscription
  })
}

/**
 * Subscribes on the result of the given speed kit baqend id
 * @param dispatch Method to dispatch an action input.
 * @param db The baqend database instance.
 * @param competitorBaqendId The speed kit baqend id to subscribe on.
 */
const subscribeOnSpeedKitTest = ({ dispatch, getState, db, speedKitBaqendId }) => {
  const callback = (r) => {
    dispatch({
      type: SPEED_KIT_RESULT_NEXT,
      payload: r
    })
    checkTestFinishState({ dispatch, getState })
  }

  const subscription = db.TestResult.find().equal('id', speedKitBaqendId).resultStream().subscribe(callback)
  dispatch({
    type: SPEED_KIT_SUBSCRIPTION,
    payload: subscription
  })
}

const checkTestFinishState = ({ dispatch, getState }) => {
  const { competitorTest, speedKitTest, competitorSubscription, speedKitSubscription } = getState().result
  if (competitorTest.hasFinished && speedKitTest.hasFinished) {
    competitorSubscription && competitorSubscription.unsubscribe()
    speedKitSubscription && speedKitSubscription.unsubscribe()
    dispatch({
      type: TERMINATE_TEST,
      payload: {}
    })
  }
}

const loadTestResults = async ({ dispatch, getState, db, competitorBaqendId, speedKitBaqendId }) => {
  const testResults = await Promise.all([
    db.TestResult.load(competitorBaqendId),
    db.TestResult.load(speedKitBaqendId)
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
    type: TERMINATE_TEST,
    payload: {}
  })
}
