import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import LoadingScreenComponent from './LoadingScreenComponent'

import { resetConfig } from 'actions/config'
import { monitorTest } from 'actions/test'
import { resetResult } from 'actions/result'


class Spinner extends Component {
  componentDidMount() {
    const { history } = this.props
    const testId = this.props.testId ? this.props.testId : this.props.match.params.testId
    try {
      this.props.actions.monitorTest(testId, (testOverview) => {
        history.replace(`/test/${testId}/result`)
      })
    } catch(e) {
      this.props.actions.resetResult()
    }
  }

  render() {
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
