import {
  CONTINUE_TEST,
  TESTOVERVIEW_LOAD,
  UPDATE_CONFIG,
  TEST_STATUS_GET,
  COMPETITOR_RESULT_NEXT,
  COMPETITOR_SUBSCRIPTION,
  SPEED_KIT_RESULT_NEXT,
  SPEED_KIT_SUBSCRIPTION
} from './types'

/**
 * Checks the status of a given test and subscribes to the result.
 * @param testId The id of the test to be monitored.
 */
export const monitorTest = (testId) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({ type: CONTINUE_TEST })
    let { testOverview } = getState().result
    if(Object.keys(testOverview).length === 0) {
      await loadTestOverviewByTestId({ dispatch, getState, db , testId})
      testOverview = getState().result.testOverview
    }

    dispatch(updateConfigByTestOverview(testOverview))
    const competitorBaqendId = testOverview.competitorTestResult
    const speedKitBaqendId = testOverview.speedKitTestResult

    checkTestStatus({ dispatch, getState, db, competitorBaqendId })

    subscribeOnCompetitorTest({ dispatch, getState, db , competitorBaqendId})
    subscribeOnSpeedKitTest({ dispatch, getState, db , speedKitBaqendId})
  }
})

/**
 * Loads a given testOverview from the baqend database.
 * @param dispatch Method to dispatch an action input.
 * @param db The baqend database instance.
 * @param testId The id of the test to be loaded.
 */
const loadTestOverviewByTestId = async ({ dispatch, db, testId }) => {
  dispatch({
    type: TESTOVERVIEW_LOAD,
    payload: await db.TestOverview.load(testId)
  })
}

/**
 * Checks the status of a given test in an interval of 2 seconds.
 * @param dispatch Method to dispatch an action input.
 * @param getState Method to get the state of the redux store.
 * @param db The baqend database instance.
 * @param competitorBaqendId The competitor test id to get the status for.
 */
const checkTestStatus = ({ dispatch, getState, db, competitorBaqendId }) => {
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
      whitelist: testOverview.whitelist
    }
  }
}

/**
 * Subscribes on the result of the given competitor baqend id
 * @param dispatch Method to dispatch an action input.
 * @param db The baqend database instance.
 * @param competitorBaqendId The competitor baqend id to subscribe on.
 */
const subscribeOnCompetitorTest = ({ dispatch, db, competitorBaqendId }) => {
  const callback = (r) => {
    dispatch({
      type: COMPETITOR_RESULT_NEXT,
      payload: r
    })
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
const subscribeOnSpeedKitTest = ({ dispatch, db, speedKitBaqendId }) => {
  const callback = (r) => {
    dispatch({
      type: SPEED_KIT_RESULT_NEXT,
      payload: r
    })
  }

  const subscription = db.TestResult.find().equal('id', speedKitBaqendId).resultStream().subscribe(callback)
  dispatch({
    type: SPEED_KIT_SUBSCRIPTION,
    payload: subscription
  })
}
