import {
  ADD_ERROR,
  REMOVE_ERROR
} from "../actions/types"

export default function errors(state = [], action = {}) {
  switch (action.type) {
    case ADD_ERROR:
      return [ action.payload, ...state ]
    case REMOVE_ERROR:
      return state.filter(error => error.message !== action.payload.message)
    default:
      return state
  }
}
