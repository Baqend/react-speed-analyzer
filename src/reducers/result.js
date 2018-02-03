import {
  INIT_TEST,
  START_TEST,
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

import { generateRules } from '../helper/utils'

const initialState = {
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
  whiteListCandidates: [],
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
    case NORMALIZE_URL_POST:
      return {
        ...state,
        isBaqendApp: action.payload.isBaqendApp,
        isSpeedKitComparison: action.payload.speedkit,
        speedKitVersion: action.payload.speedkitVersion,
      }
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
    case START_TEST_COMPETITOR_POST:
      return {
        ...state, testOverview: {
          ...state.testOverview, competitorTestResult: `/db/TestResult/${action.payload.baqendId }`
        }
      }
    case START_TEST_SPEED_KIT_POST:
      return {
        ...state, testOverview: {
          ...state.testOverview, speedKitTestResult: `/db/TestResult/${action.payload.baqendId }`
        }
      }
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
      return {
        ...state,
        competitorSubscription: null,
        speedKitSubscription: null,
        isInitiated: false,
        isStarted: false,
        isFinished: true,
      }
    case RESET_TEST_RESULT:
      return { ...initialState }
    default:
      return state
  }
}
