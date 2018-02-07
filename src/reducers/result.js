import {
  INIT_TEST,
  START_TEST,
  MONITOR_TEST,
  CONTINUE_TEST,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_SAVE,
  RATE_LIMITER_GET,
  NORMALIZE_URL_POST,
  CALL_PAGESPEED_INSIGHTS_GET,
  START_TEST_COMPETITOR_POST,
  START_TEST_SPEED_KIT_POST,
  TEST_STATUS_GET,
  COMPETITOR_RESULT_NEXT,
  SPEED_KIT_RESULT_NEXT,
  COMPETITOR_SUBSCRIPTION,
  SPEED_KIT_SUBSCRIPTION,
  TERMINATE_TEST,
  RESET_TEST_RESULT,
} from '../actions/types'

import { generateRules } from '../helper/configHelper'
import {
  isMainMetricSatisfactory,
  resultIsValid,
  shouldShowFirstMeaningfulPaint
} from '../helper/resultHelper'

const initialState = {
  isMonitored: false,
  isFinished: false,
  isInitiated: false,
  isStarted: false,
  isRateLimited: false,
  isBaqendApp: false,
  isSpeedKitComparison: false,
  speedKitVersion: null,
  testOverview: {},
  statusCode: null,
  statusText: '',
  competitorSubscription: null,
  speedKitSubscription: null,
  competitorTest: {},
  speedKitTest: {},
  competitorError: false,
  speedKitError: false,
  mainMetric: 'speedIndex',
  secondaryMetric: 'firstMeaningfulPaint',
  whiteListCandidates: [],
}

const getResultErrors = ({ competitorTest, speedKitTest, mainMetric, secondaryMetric }) => {
  const result = {
    competitorError: false,
    speedKitError: false,
  }
  if(!competitorTest || competitorTest.testDataMissing) {
    result['competitorError'] = true
    result['speedKitError'] = true
  }
  const isValidResult = resultIsValid(competitorTest, speedKitTest, mainMetric, secondaryMetric)
  if(!speedKitTest || speedKitTest.testDataMissing || !isValidResult) {
    // console.log('SpeedKit konnte nicht getestet werden => Zeige Kontaktformular')
    // this.setState({ speedKitError: true })
    // result['competitorError'] = true
    result['speedKitError'] = true
  }
  return result
}

const verifyMainMetric = ({ competitorTest, speedKitTest, mainMetric, secondaryMetric }) => {
  const competitorData = competitorTest.firstView
  const speedKitData = speedKitTest.firstView
  if (competitorData && speedKitData) {
    const mainMetric = shouldShowFirstMeaningfulPaint(competitorData, speedKitData) ? 'firstMeaningfulPaint' : 'speedIndex'
    const secondaryMetric = shouldShowFirstMeaningfulPaint(competitorData, speedKitData) ? 'speedIndex' : 'firstMeaningfulPaint'
    return {
      mainMetric,
      secondaryMetric
    }
  }
  return {
    mainMetric,
    secondaryMetric
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

export default function result(state = initialState, action = {}) {
  switch (action.type) {
    case TESTOVERVIEW_LOAD:
      return { ...state, testOverview: action.payload }
    case TESTOVERVIEW_SAVE:
      return { ...state, testOverview: action.payload }
    case RATE_LIMITER_GET:
      return { ...state, isRateLimited: action.payload }
    // case NORMALIZE_URL_POST:
    //   return {
    //     ...state,
    //     isBaqendApp: action.payload.isBaqendApp,
    //     isSpeedKitComparison: action.payload.speedkit,
    //     speedKitVersion: action.payload.speedkitVersion,
    //   }
    case MONITOR_TEST:
      return { ...state, isMonitored: true }
    case INIT_TEST:
      return { ...state, isInitiated: true }
    case START_TEST:
      return { ...state, isStarted: true }
    case CONTINUE_TEST:
      return { ...state, isInitiated: true, isStarted: true }
    case CALL_PAGESPEED_INSIGHTS_GET:
      console.log(action.payload)
      return {
        ...state, testOverview: {
          ...state.testOverview,
          psiDomains: action.payload.domains,
          psiRequests: action.payload.requests,
          psiResponseSize: action.payload.bytes,
          psiScreenshot: action.payload.screenshot,
        }
      }
    // case START_TEST_COMPETITOR_POST:
    //   return {
    //     ...state, testOverview: {
    //       ...state.testOverview, competitorTestResult: `/db/TestResult/${action.payload.baqendId }`
    //     }
    //   }
    // case START_TEST_SPEED_KIT_POST:
    //   return {
    //     ...state, testOverview: {
    //       ...state.testOverview, speedKitTestResult: `/db/TestResult/${action.payload.baqendId }`
    //     }
    //   }
    case TEST_STATUS_GET:
      return { ...state, statusCode: action.payload.statusCode, statusText: action.payload.statusText  }
    case COMPETITOR_RESULT_NEXT:
      const competitorTest = action.payload[0] ? action.payload[0] : {}
      return { ...state, competitorTest }
    case SPEED_KIT_RESULT_NEXT:
      if (action.payload[0]) {
        const speedKitTest = action.payload[0]
        const whiteListCandidates = getWhiteListCandidates(state, speedKitTest)
        return { ...state, speedKitTest, whiteListCandidates }
      }
      return state
    case COMPETITOR_SUBSCRIPTION:
      return { ...state, competitorSubscription: action.payload }
    case SPEED_KIT_SUBSCRIPTION:
      return { ...state, speedKitSubscription: action.payload }
    case TERMINATE_TEST:
      const errors = getResultErrors(state)
      const metrics = verifyMainMetric(state)
      return {
        ...state,
        ...errors,
        ...metrics,
        competitorSubscription: null,
        speedKitSubscription: null,
        isInitiated: false,
        isStarted: false,
        isFinished: true,
        isMonitored: false,
      }
    case RESET_TEST_RESULT:
      return {
        ...initialState,
        isBaqendApp: state.isBaqendApp,
        isSpeedKitComparison: state.isSpeedKitComparison,
        speedKitVersion: state.speedKitVersion,
      }
    default:
      return state
  }
}
