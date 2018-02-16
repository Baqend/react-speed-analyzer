import React from 'react'
import ReactDOM from 'react-dom'

import Result from './containers/Result'

import 'promise-polyfill'
import 'whatwg-fetch'

window.speedKitAnalyzer = {
  renderTestResult: (testId) => {
    ReactDOM.render(<Result testId={testId} />, document.getElementById('speed-kit-analyzer'))
  }
}

if (process.env.NODE_ENV === 'development') {
  window.speedKitAnalyzer.renderTestResult('gaNDEbalibaba')
}
