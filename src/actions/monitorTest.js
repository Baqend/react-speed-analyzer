import {
  TESTOVERVIEW_LOAD,
  UPDATE_CONFIG,
  TEST_STATUS_GET,
  COMPETITOR_RESULT_NEXT,
  COMPETITOR_SUBSCRIPTION,
  SPEED_KIT_RESULT_NEXT,
  SPEED_KIT_SUBSCRIPTION
} from './types'

export const monitorTest = (testId) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    let { testOverview } = getState().result
    if(Object.keys(testOverview).length === 0) {
      await loadTestOverviewByTestId({ dispatch, getState, db , testId})
      testOverview = getState().result.testOverview
    }

    dispatch(updateConfigByTestOverview(testOverview))
    const competitorBaqendId = testOverview.competitorTestResult
    const speedKitBaqendId = testOverview.speedKitTestResult
    console.log(speedKitBaqendId)
    checkTestStatus({ dispatch, getState, db, competitorBaqendId })

    subscribeOnCompetitorTest({ dispatch, getState, db , competitorBaqendId})
    subscribeOnSpeedKitTest({ dispatch, getState, db , speedKitBaqendId})
  }
})

async function loadTestOverviewByTestId({ dispatch, getState, db, testId }) {
  dispatch({
    type: TESTOVERVIEW_LOAD,
    payload: await db.TestOverview.load(testId)
  })
}

function checkTestStatus({ dispatch, getState, db, competitorBaqendId }) {
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

async function getTestStatus({ dispatch, getState, db, competitorBaqendId }) {
  const res = await db.modules.get('getTestStatus', { baqendId: competitorBaqendId })
  const status = { statusCode: res.status.statusCode, statusText: res.status.statusText }

  dispatch({
    type: TEST_STATUS_GET,
    payload: status
  })
}

function updateConfigByTestOverview(testOverview) {
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

function subscribeOnCompetitorTest({ dispatch, getState, db, competitorBaqendId }) {
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

function subscribeOnSpeedKitTest({ dispatch, getState, db, speedKitBaqendId }) {
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

