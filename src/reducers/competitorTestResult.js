import { START_TEST_COMPETITOR_POST_SUCCESS } from '../actions/types'

const initialState = {
  testId: null
}

export default function competitorTestResult(state = initialState, action = {}) {
  switch (action.type) {
    case START_TEST_COMPETITOR_POST_SUCCESS:
      console.log(action.payload)
      return { ...state, testId: action.payload.baqendId }
    default:
      return state
  }
}

