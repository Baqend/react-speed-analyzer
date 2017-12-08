import { applyMiddleware, combineReducers } from 'redux'

import { createStoreWithBaqend, baqendReducer } from 'redux-baqend'
import middlewares from '../middleware'
import reducers from '../reducers'

import { db } from 'baqend'

export default (initialState = {}) => {
  const reducer = combineReducers({
    baqend: baqendReducer,
    ...reducers
  })
  const middleware = applyMiddleware(
    ...middlewares
  )
  return createStoreWithBaqend(
    db.connect('app-starter', true),
    reducer,
    initialState,
    middleware
  )
}
