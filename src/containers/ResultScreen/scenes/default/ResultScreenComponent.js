import React, { Component } from 'react'

import './ResultScreen.css'
import Modal from 'react-modal'

import ResultHeader from '../../components/Result/ResultHeader'
import ResultBody from '../../components/Result/ResultBody'
import ResultFooter from '../../components/Result/ResultFooter'

Modal.setAppElement('#speed-kit-analyzer')

class ResultScreenComponent extends Component {
  render() {
    return (
      <div className={"flex-column flex-grow-1 flex"} style={{ overflow: 'hidden' }}>
        <ResultHeader embedded={false} {...this.props} />
        <ResultBody embedded={false} {...this.props} />
        {this.props.result.isFinished && <ResultFooter {...this.props}/>}
      </div>
    )
  }
}

export default ResultScreenComponent
