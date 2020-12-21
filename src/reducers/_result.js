import {
  INIT_TEST,
  START_TEST,
  MONITOR_TEST,
  CONTINUE_TEST,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_LOAD_FAIL,
  TESTOVERVIEW_NEXT,
  RATE_LIMITER_GET,
  TEST_STATUS_GET,
  UPDATE_TEST_PROGRESS,
  COMPETITOR_RESULT_LOAD,
  SPEED_KIT_RESULT_LOAD,
  TERMINATE_TEST,
  RESET_TEST_RESULT,
  RESET_TEST_STATUS,
  SPEED_KIT_RESULT_NEXT,
  COMPETITOR_RESULT_NEXT,
} from '../actions/types'

import { generateRules } from '../helper/configHelper'
import { resultIsValid } from '../helper/resultHelper'

const PROGRESS_SESSION_KEY = 'baqend-progress'

const createScreenshot = (psiScreenshot) => {
  if (psiScreenshot) {
    return `https://${process.env.REACT_APP_BAQEND}/v1${psiScreenshot}`
  }
  return null
}

const getResultErrors = ({ competitorTest, speedKitTest, mainMetric, secondaryMetric }, isPlesk) => {
  const result = {
    competitorError: false,
    speedKitError: false,
  }
  if(!competitorTest || competitorTest.testDataMissing || !competitorTest.firstView) {
    result['competitorError'] = true
    result['speedKitError'] = true
  }

  const isValidResult = resultIsValid(competitorTest, speedKitTest, mainMetric, secondaryMetric, isPlesk)

  if(!speedKitTest || speedKitTest.testDataMissing || !isValidResult) {
    result['speedKitError'] = true
  }
  return result
}

const verifyMainMetric = (passedMainMetric, { mainMetric, secondaryMetric }) => {
  if (!passedMainMetric) {
    return {
      mainMetric,
      secondaryMetric
    }
  }

  return {
    mainMetric: passedMainMetric,
    secondaryMetric: passedMainMetric === 'speedIndex' ? 'firstMeaningfulPaint' : 'speedIndex'
  }
}

const getWhiteListCandidates = (state, speedKitTest) => {
  const url = state.testOverview.url
  const whitelist = state.testOverview.whitelist || {}
  const domains = speedKitTest.firstView && speedKitTest.firstView.domains

  if (domains) {
    const rules = generateRules(url, whitelist)
    const regexp = new RegExp(rules)
    return domains
      .sort((a, b) => parseFloat(b.requests) - parseFloat(a.requests))
      .filter(domain => (
        !regexp.test(domain.url)
          && domain.url.indexOf('makefast') === -1
          && domain.url.indexOf('app.baqend') === -1
          && !domain.isAdDomain
      ))
      .splice(0, 6)
  }
  return []
}

const initialState = {
  isMonitored: false,
  isFinished: false,
  isInitiated: false,
  isStarted: false,
  isRateLimited: false,
  isBaqendApp: false,
  isSpeedKitComparison: false,
  isPlesk: false,
  useFactor: true,
  speedKitVersion: null,
  testOverview: {},
  prewarmFinished: false,
  finishedTests: 0,
  statusCode: null,
  statusText: '',
  testProgress: 0,
  competitorSubscription: null,
  speedKitSubscription: null,
  competitorTest: {},
  speedKitTest: {},
  competitorError: false,
  speedKitError: false,
  mainMetric: 'firstMeaningfulPaint',
  secondaryMetric: 'speedIndex',
  whiteListCandidates: [],
  startTime: null,
}

export default function result(state = initialState, action = {}) {
  switch (action.type) {
    case TESTOVERVIEW_LOAD:
      return {
        ...state, testOverview: { ...action.payload, psiScreenshot: createScreenshot(action.payload.psiScreenshot) }
      }
    case TESTOVERVIEW_NEXT:
      // Do not trigger update if the test is not started anymore e.g. because of backward navigation
      if (!state.isStarted) {
        return { ...state }
      }
      return {
        ...state, testOverview: { ...action.payload, psiScreenshot: createScreenshot(action.payload.psiScreenshot) }
      }
    case COMPETITOR_RESULT_NEXT:
      // Do not trigger update if the test is not started anymore e.g. because of backward navigation
      if (!state.isStarted) {
        return { ...state}
      }
      return { ...state, competitorTest: state.isStarted ? { ...action.payload } : state.competitorTest }
    case SPEED_KIT_RESULT_NEXT:
      // Do not trigger update if the test is not started anymore e.g. because of backward navigation
      if (!state.isStarted) {
        return { ...state}
      }
      return { ...state, speedKitTest: state.isStarted ? { ...action.payload } : state.speedKitTest }
    case TESTOVERVIEW_LOAD_FAIL:
      return { ...state, isFinished: true }
    case RATE_LIMITER_GET:
      return { ...state, isRateLimited: action.payload }
    case MONITOR_TEST:
      return { ...state, isStarted: true, isMonitored: true }
    case INIT_TEST:
      return { ...state, isInitiated: true }
    case START_TEST:
      return { ...state, isStarted: true, startTime: new Date() }
    case UPDATE_TEST_PROGRESS:
      // Persist progress in session storage to make it usable on reload.
      sessionStorage.setItem(PROGRESS_SESSION_KEY, action.payload)
      return { ...state, testProgress: action.payload }
    case CONTINUE_TEST:
      return { ...state, isInitiated: true, isStarted: true }
    case TEST_STATUS_GET:
      return { ...state, statusCode: action.payload.statusCode, statusText: action.payload.statusText  }
    case COMPETITOR_RESULT_LOAD:
      if (action.payload) {
        const competitorTest = action.payload
        return {
          ...state,
          competitorTest,
        }
      }
      return state
    case SPEED_KIT_RESULT_LOAD:
      if (action.payload) {
        const speedKitTest = action.payload
        const whiteListCandidates = getWhiteListCandidates(state, speedKitTest)
        return {
          ...state,
          speedKitTest,
          whiteListCandidates
        }
      }
      return state
    case TERMINATE_TEST:
      const metrics = verifyMainMetric(action.payload.mainMetric, state)
      const isPlesk = action.payload.isPlesk
      const useFactor = action.payload.useFactor
      const errors = getResultErrors({ ...state, ...metrics }, isPlesk)
      return {
        ...state,
        ...errors,
        ...metrics,
        isPlesk,
        useFactor,
        competitorSubscription: null,
        speedKitSubscription: null,
        isInitiated: false,
        isStarted: false,
        isFinished: true,
        isMonitored: false,
      }
    case RESET_TEST_RESULT:
      sessionStorage.removeItem(PROGRESS_SESSION_KEY)
      return {
        ...initialState,
        isInitiated: state.isInitiated,
        isStarted: state.isStarted,
        isBaqendApp: state.isBaqendApp,
        isSpeedKitComparison: state.isSpeedKitComparison,
        speedKitVersion: state.speedKitVersion,
      }
    case RESET_TEST_STATUS:
      return {
        ...initialState
      }
    default:
      return state
  }
}
