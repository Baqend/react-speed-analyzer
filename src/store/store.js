import { applyMiddleware, combineReducers } from 'redux'

import { db } from 'baqend'
import { createStoreWithBaqend, baqendReducer } from 'redux-baqend'

import middlewares from '../middleware'
import reducers from '../reducers'

export default (initialState = {}) => {
  const reducer = combineReducers({
    baqend: baqendReducer,
    ...reducers,
  })
  const middleware = applyMiddleware(...middlewares)
  return createStoreWithBaqend(
    db.connect('makefast', true),
    reducer,
    initialState,
    middleware,
  )
}
