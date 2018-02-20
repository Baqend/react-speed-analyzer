import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import SpinnerComponent from './SpinnerComponent'
import ResultScreen from 'containers/ResultScreen/scenes/embedded'

import { resetConfig } from 'actions/config'
import { terminateTest } from 'actions/terminateTest'
import { resetTest, monitorTest } from 'actions/monitorTest'
import { prepareTest, startTest } from 'actions/startTest'


class Spinner extends Component {
  reset = () => {
    this.props.actions.resetConfig()
    this.props.actions.resetTest()
  }


  componentWillMount() {
    const { testId } = this.props
    const { isMonitored } = this.props.result

    if (testId && !isMonitored) {
      this.props.actions.monitorTest(testId, true).catch((e) => {
        console.log(e)
        this.props.actions.resetTest()
      })
    }

    this.onAfterFinish = this.props.onAfterFinish
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.result.isFinished) {
      this.onAfterFinish && this.onAfterFinish(nextProps.testOverview)
      this.onAfterFinish = null
    }
  }

  render() {
    if (this.props.result.isFinished) {
      return (<ResultScreen { ...this.props } />)
    }
    return (
      <SpinnerComponent { ...this.props } />
    )
  }
}

Spinner.propTypes = {
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
      prepareTest,
      startTest,
      resetTest,
      monitorTest,
      terminateTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Spinner)
