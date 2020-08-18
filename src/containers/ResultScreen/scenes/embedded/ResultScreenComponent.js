import React, { Component } from 'react'

import ResultHeader from '../../components/Result/ResultHeader'
import ResultBody from '../../components/Result/ResultBody'
import ResultError from '../../components/Result/ResultError'

class ResultScreenComponent extends Component {
  render() {
    const {competitorError, speedKitError, isFinished} = this.props.result
    const showError = competitorError || speedKitError

    return (
      <div className={"flex-column flex-grow-1 flex"} style={{ overflow: 'hidden' }}>
        {showError ? ( <ResultError {...this.props}/>) : (
          <div>
            {isFinished && (
              <div>
                <ResultHeader embedded={false} {...this.props} />
                <ResultBody embedded={false} {...this.props} />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}

export default ResultScreenComponent
