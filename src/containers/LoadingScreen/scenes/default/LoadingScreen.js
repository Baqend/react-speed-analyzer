import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import './LoadingScreen.css'
import LoadingScreenComponent from './LoadingScreenComponent'

import { resetConfig } from 'actions/config'
import { resetResult } from 'actions/result'
import { monitorTest } from 'actions/test'


class LoadingScreen extends Component {
  componentDidMount() {
    const { history } = this.props
    const { testId } = this.props.match.params

    try {
      this.props.actions.monitorTest(testId, () => {
        // Wait one second to ensure the user can see the final animation of the progress bar
        setTimeout(() => {
          history.replace(`/test/${testId}/result${history.location.search}`)
        }, 1000)
      })
    } catch(e) {
      this.props.actions.resetResult()
      history.replace('/')
    }
  }

  render() {
    return (
      <LoadingScreenComponent { ...this.props } { ...this.state} onSubmit={this.onSubmit} />
    )
  }
}

LoadingScreen.propTypes = {
  testOverview: PropTypes.object,
  actions: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  isRateLimited: PropTypes.bool.isRequired,
  isBaqendApp: PropTypes.bool.isRequired,
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    testOverview: state.result.testOverview,
    config: state.config,
    isRateLimited: state.result.isRateLimited,
    isBaqendApp: state.result.isBaqendApp,
    competitorTest: state.result.competitorTest,
    speedKitTest: state.result.speedKitTest,
    result: state.result,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      resetConfig,
      resetResult,
      monitorTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LoadingScreen)
