import React, { Component } from 'react'

import ResultHeader from '../../components/Result/ResultHeader'
import ResultBody from '../../components/Result/ResultBody'

class ResultScreenComponent extends Component {
  render() {
    return (
      <div className={"flex-column flex-grow-1 flex"} style={{ overflow: 'hidden' }}>
        <ResultHeader embedded={true} {...this.props} />
        <ResultBody embedded={true} {...this.props} />
      </div>
    )
  }
}

export default ResultScreenComponent
