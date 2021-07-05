import React from 'react'
import ReactDOM from 'react-dom'

import Result from './containers/Result'
import Loader from './containers/Loader'
import Embedded from './containers/Embedded'

import 'whatwg-fetch'

console.log(import.meta.env.VITE_REACT_APP_SCREEN_TYPE)

window.speedKitAnalyzer = {
  renderResult: (testId, { isPlesk = false, mainMetric = 'speedIndex' } = {}) => {
    ReactDOM.unmountComponentAtNode(document.getElementById('speed-kit-analyzer'))
    ReactDOM.render(<Result testId={testId} isPlesk={isPlesk} mainMetric={mainMetric}/>,
      document.getElementById('speed-kit-analyzer'))
  },
  renderTest: (testId, callback, { isPlesk = false } = {}) => {
    ReactDOM.render(<Loader testId={testId} isPlesk={isPlesk} onAfterFinish={callback} />,
      document.getElementById('speed-kit-analyzer'))
  },
  renderAnalyzer: (params) => {
    ReactDOM.render(<Embedded { ...params } />, document.getElementById('speed-kit-analyzer'))
  }
}

if (import.meta.env.DEV) {
  window.startTest = (url) => fetch(`https://${import.meta.env.VITE_REACT_APP_BAQEND}/v1/code/bulkTest`, {
    method: 'POST',
    body: JSON.stringify({
      "tests": [{ "url": url, "priority": 0 }]
    }),
    headers: {
      'content-type': 'application/json'
    },
  }).then(r => r.json()
    .then(r => r[0].testOverviews[0].replace('/db/TestOverview/', '')))

  if (import.meta.env.VITE_REACT_APP_SCREEN_TYPE === 'analyzer') {
    window.speedKitAnalyzer.renderAnalyzer({ url: 'www.bild.de' })
  }
  else if (import.meta.env.VITE_REACT_APP_SCREEN_TYPE === 'result') {
    window.speedKitAnalyzer.renderResult('S5oS1Zalibaba')
  }
  else if (import.meta.env.VITE_REACT_APP_SCREEN_TYPE === 'test') {
    window.startTest('www.alibaba.com').then(res => {
      window.speedKitAnalyzer.renderTest(res, () => {
        alert("test finished")
      })
    })
  }
}
