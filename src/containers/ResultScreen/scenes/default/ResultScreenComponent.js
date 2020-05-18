import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './ResultScreen.css'
import Modal from 'react-modal'

import ResultHeader from '../../components/Result/ResultHeader'
import ResultBody from '../../components/Result/ResultBody'
import ResultFooter from '../../components/Result/ResultFooter'

Modal.setAppElement('#speed-kit-analyzer')

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isIFrame: props.isIFrame,
    }
  }

  render() {
    return (
      <div className={"flex-column flex-grow-1 flex"} style={{ overflow: 'hidden' }}>
        <ResultHeader {...this.props} />
        <ResultBody {...this.props} />
        {this.props.result.isFinished && <ResultFooter/>}
      </div>
    )
  }
}

ResultScreenComponent.propTypes = {
  onToggleAdvancedConfig: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default ResultScreenComponent
