import { TERMINATE_TEST } from './types'

export function terminateTest() {
  return {
    type: TERMINATE_TEST,
    payload: {}
  }
}
