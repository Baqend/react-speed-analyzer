import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import LoadingScreenComponent from './LoadingScreenComponent'
import ResultScreen from 'containers/ResultScreen/scenes/embedded'

import { resetConfig } from 'actions/config'
import { monitorTest } from 'actions/test'
import { resetResult } from 'actions/result'


class Spinner extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isFinished: false
    }
  }

  componentDidMount() {
    const testId = this.props.testId ? this.props.testId : this.props.match.params.testId
    try {
      this.props.actions.monitorTest(testId, (testOverview) => {
        this.setState({ isFinished: true }, () => {
          this.props.onAfterFinish && this.props.onAfterFinish(testOverview)
        })
      })
    } catch(e) {
      this.props.actions.resetResult()
    }
  }

  render() {
    if (this.state.isFinished) {
      return (<ResultScreen { ...this.props } />)
    }
    return (
      <LoadingScreenComponent { ...this.props } />
    )
  }
}

Spinner.propTypes = {
  actions: PropTypes.object.isRequired,
  result: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    config: state.config,
    result: state.result,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ resetConfig, resetResult, monitorTest }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Spinner)
