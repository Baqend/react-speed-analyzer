import { createLogger } from 'redux-logger'

let middlewares

if (import.meta.env.DEV) {
  middlewares = [
    createLogger()
  ]
} else {
  middlewares = []
}

export default middlewares
