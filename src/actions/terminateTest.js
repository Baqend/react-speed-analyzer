import { TERMINATE_TEST } from './types'

/**
 * Unsubscribes existing subscriptions.
 */
export const terminateTest = () => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const { competitorSubscription, speedKitSubscription, isFinished } = getState().result
    if (competitorSubscription) {
      competitorSubscription.unsubscribe()
    }
    if (speedKitSubscription) {
      speedKitSubscription.unsubscribe()
    }
    if (!isFinished) {
      dispatch({
        type: TERMINATE_TEST,
        payload: {}
      })
    }
  }
})
