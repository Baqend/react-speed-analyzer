import {
  ADD_ERROR, INIT_TEST,
  REMOVE_ERROR, RESET_TEST_RESULT
} from "./types"
import {isURL} from "../helper/utils";

export const addError = (error) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    console.log("ERRRRRROOOOOR", error)
    dispatch({
      type: ADD_ERROR,
      payload: error,
    })
  }
})

export function removeError(error) {
  return {
    type: REMOVE_ERROR,
    payload: error,
  }
}
