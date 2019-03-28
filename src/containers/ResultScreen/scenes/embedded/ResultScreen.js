import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { startTest, prepareTest } from 'actions/test'
import { loadResult } from 'actions/result'

import { getObjectKey } from 'helper/utils'

import ResultScreenComponent from './ResultScreenComponent'

class ResultScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: false,
      showConfig: false,
      showAdvancedConfig: false,
    }
    this.loadTestResult()
  }

  loadTestResult = async () => {
    const testId = this.props.testId ? this.props.testId : this.props.match.params.testId
    const isPlesk = this.props.isPlesk
    const mainMetric = this.props.mainMetric

    try {
      const testOverview = await this.props.actions.loadResult(testId, isPlesk, mainMetric)
      this.props.onAfterFinish && this.props.onAfterFinish(testOverview)
    } catch(e) {
      console.log(e)
    }
  }

  onSubmit = async () => {
    const { history } = this.props
    const useAdvancedConfig = this.state.showAdvancedConfig

    try {
      await this.props.actions.prepareTest(this.props.config.url)
      const testOverview = await this.props.actions.startTest(useAdvancedConfig)
      history.push(`/test/${getObjectKey(testOverview.id)}${history.location.search}`)
    } catch (e) {}
  }

  render() {
    return (
      <ResultScreenComponent { ...this.props } { ...this.state } onSubmit={this.onSubmit} />
    )
  }
}

ResultScreen.defaultProps = {
  showInput: false,
}

ResultScreen.propTypes = {
  showInput: PropTypes.bool,
  config: PropTypes.object.isRequired,
  result: PropTypes.object.isRequired,
  testOverview: PropTypes.object.isRequired,
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    config: state.config,
    result: state.result,
    testOverview: state.result.testOverview,
    competitorTest: state.result.competitorTest,
    speedKitTest: state.result.speedKitTest,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      loadResult,
      startTest,
      prepareTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen)
