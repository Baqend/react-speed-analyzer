import { START_TEST_SPEED_KIT_POST_SUCCESS } from '../actions/types'

const initialState = {
  testId: null
}

export default function speedKitTestResult(state = initialState, action = {}) {
  switch (action.type) {
    case START_TEST_SPEED_KIT_POST_SUCCESS:
      return { ...state, testId: action.payload.baqendId }
    default:
      return state
  }
}

