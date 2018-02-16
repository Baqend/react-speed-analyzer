import { createLogger } from 'redux-logger'

let middlewares

if (process.env.NODE_ENV === 'development') {
  middlewares = [
    createLogger()
  ]
} else {
  middlewares = []
}

export default middlewares
