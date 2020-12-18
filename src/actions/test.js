import {
  ADD_ERROR,
  INIT_TEST,
  START_TEST,
  UPDATE_TEST_PROGRESS,
  MONITOR_TEST,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_NEXT,
  TEST_STATUS_GET,
  RESET_TEST_RESULT,
  SPEED_KIT_RESULT_NEXT,
  COMPETITOR_RESULT_NEXT,
} from './types'

import { isURL, trackURL } from '../helper/utils'
import stringifyObject from 'lib/stringify-object'

/**
 * Prepares the test before its execution (check rate limiting and normalize url).
 */
export const prepareTest = (url = null) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({
      type: INIT_TEST,
    })
    try {
      if (!isURL(url)) {
        throw new Error("Input is not a valid url")
      }
    } catch(e) {
      dispatch({
        type: RESET_TEST_RESULT,
      })
      dispatch({
        type: ADD_ERROR,
        payload: e.message,
      })
      throw e
    }
  }
})

/**
 * Triggers the start of a new test.
 */
export const startTest = (useAdvancedConfig = true) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({
      type: RESET_TEST_RESULT
    })
    const { url, location, caching, mobile, activityTimeout, cookie } = getState().config
    try {
      dispatch({
        type: START_TEST,
      })
      const { testOverview } = getState().result

      const speedKit = testOverview.isSpeedKitComparison
      let speedKitConfig = !speedKit || (speedKit && useAdvancedConfig) ? getState().config.speedKitConfig : null

      if (mobile && speedKitConfig) {
        // eslint-disable-next-line no-eval
        const speedKitConfigObj = eval(`(${speedKitConfig})`)
        if (!speedKitConfigObj.userAgentDetection) {
          speedKitConfigObj.userAgentDetection = true
        }
        speedKitConfig = stringifyObject(speedKitConfigObj, { indent: '  ' })
      }

      trackURL('startComparison', url)

      return db.modules.post('startComparison', {
        url,
        location,
        caching,
        mobile,
        speedKitConfig,
        activityTimeout,
        cookie,
        withPuppeteer: false,
      })
    } catch(e) {
      trackURL('failedComparison', url)

      dispatch({
        type: RESET_TEST_RESULT,
      })
      dispatch({
        type: ADD_ERROR,
        payload: e.message,
      })
      throw e
    }
  }
})

/**
 * Checks the status of a given test and subscribes to the result.
 * @param testId The id of the test to be monitored.
 */
export const monitorTest = (testId, onAfterFinish) => ({
  'BAQEND': async ({ dispatch }) => {
    dispatch({ type: MONITOR_TEST })
    dispatch(computeTestProgress())
    const testOverview = await dispatch(subscribeToTestOverview({ testId, onAfterFinish }))
    // TODO: This is needed for the status update of the embedded version
    if (!testOverview.hasFinished) {
      dispatch(checkTestStatus())
    }
  }
})

const subscribeToTestResult = (testId, isSpeedKitComparison) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const stream = db.TestResult.find().equal('id', testId).resultStream()
    const subscription = stream.subscribe((res) => {
      const testResult = res[0] ? res[0].toJSON() : null
      if (!testResult) {
        return
      }

      dispatch({
        type: isSpeedKitComparison ? SPEED_KIT_RESULT_NEXT: COMPETITOR_RESULT_NEXT,
        payload: testResult
      })

      if (testResult.hasFinished) {
        subscription.unsubscribe()
      }
    })
  }
})

const subscribeToTestOverview = ({ testId, onAfterFinish }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    let isResolved = false
    let trackUnload = null
    const testOverviewStream = db.TestOverview.find().equal('id', `/db/TestOverview/${testId}`).resultStream()
    const testOverviewPromise = new Promise((resolve, reject) => {
      const testOverviewSubscription = testOverviewStream.subscribe((res) => {
        const testOverview = res[0] ? res[0].toJSON() : null
        if (testOverview) {
          if (testOverview.competitorTestResult && !getState().result.speedKitTestResult) {
            dispatch(subscribeToTestResult(testOverview.competitorTestResult, false))
          }
          if (testOverview.speedKitTestResult && !getState().result.speedKitTestResult) {
            dispatch(subscribeToTestResult(testOverview.speedKitTestResult, true))
          }

          if (!trackUnload) {
            trackUnload = () => {
              trackURL('leaveDuringTest', testOverview.url, { startTime: getState().result.startTime })
            }
            window.addEventListener('beforeunload', trackUnload)
          }

          if (testOverview.hasFinished) {
            window.removeEventListener('beforeunload', trackUnload)
            testOverviewSubscription && testOverviewSubscription.unsubscribe()
            // Do not trigger reload if the test is not started anymore e.g. because of backward navigation
            onAfterFinish && getState().result.isStarted && onAfterFinish({ testId })
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
          testOverviewPromise.then(() => {
            isResolved = true
          })
          resolve(testOverview)
        }
      })
    })
    return testOverviewPromise
  }
})

const computeTestProgress = () => ({
  'BAQEND': ({ dispatch, getState }) => {
    const interval = setInterval( () => {
      const doComputation = (upperBorder) => {
        const persistedProgress = parseInt(sessionStorage.getItem('baqend-progress') || 0, 10)
        const { testProgress: reduxProgress } = getState().result
        const testProgress = persistedProgress < 100 ? persistedProgress : reduxProgress
        const increaseBy = Math.floor(Math.random() * 3) + 1

        // Set immediately to 100% if the upper border is 100 (test has finished).
        const computedProgress = upperBorder < 100 ? testProgress + increaseBy : 100
        const newProgress = computedProgress < upperBorder ? computedProgress : upperBorder
        dispatch({
          type: UPDATE_TEST_PROGRESS,
          payload: newProgress
        })
      }

      const getUpperBorder = () => {
        const { testOverview, speedKitTest, competitorTest } = getState().result
        const { puppeteer: puppeteerFinished, hasFinished: testOverviewFinished } = testOverview
        const { hasFinished: speedKitFinished, webPagetests } = speedKitTest
        const { hasFinished: competitorFinished } = competitorTest

        // Check if the whole test (both speed kit and competitor) is finished.
        // Check first to ensure that the progress bar always finish with 100%.
        if (testOverviewFinished) {
          return 100
        }

        // Check if the puppeteer analysis is finished.
        if (!puppeteerFinished) {
          return 50
        }

        // Check if the prewarm run of the speed kit test is finished.
        if (!webPagetests || !webPagetests.find((test) => test.testType === 'prewarm' && test.status === 'SUCCESS')) {
          return 75
        }

        // Check if at least one of the two test is finished.
        if (!speedKitFinished && !competitorFinished) {
          return 90
        }

        return 99
      }

      const upperBorder = getUpperBorder()
      doComputation(upperBorder)
      upperBorder === 100 && clearInterval(interval)
    }, 750)
    return interval
  }
})

const checkTestStatus = () => ({
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
      const { testOverview } = getState().result
      const testId = testOverview.competitorTestResult
      if (testId) {
        try {
          const { statusCode } = await dispatch(pullTestStatus(testId))
          if (statusCode === 100 || statusCode === 200) {
            clearInterval(interval)
          }
        } catch (e) {
          clearInterval(interval)
        }
      }
    }, 2000)
    return interval
  }
})

