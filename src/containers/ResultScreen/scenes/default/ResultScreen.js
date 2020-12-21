import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ResultScreenComponent from './ResultScreenComponent'

import { startTest, prepareTest } from 'actions/test'
import { loadResult, resetResult } from 'actions/result'

import { getObjectKey } from 'helper/utils'

class ResultScreen extends Component {
  constructor(props) {
    super(props)

    const params = this.props.location.search.replace('?', '').split('&')
    this.state = {
      showDetails: params.indexOf('details') > -1,
      showConfig: params.indexOf('config') > -1 || params.indexOf('advanced') > -1,
      showAdvancedConfig: params.indexOf('advanced') > -1,
    }

    const { testId } = this.props.match.params
    if (testId) {
      const showLCP = this.props.match.path.indexOf('/overview') !== -1
      const useFactor = this.props.match.path.indexOf('/summary') === -1
      this.loadTestResult(testId, showLCP ? 'largestContentfulPaint' : 'firstMeaningfulPaint', useFactor)
    }
  }

  loadTestResult = async (testId, mainMetric, useFactor) => {
    try {
      await this.props.actions.loadResult(testId, false, mainMetric, useFactor)
    } catch(e) {
      console.log(e)
    }
  }

  componentDidUpdate(prevProps) {
    const nextProps = this.props
    if (prevProps.match.params.testId !== nextProps.match.params.testId) {
      window.scrollTo(0, 0)
      prevProps.actions.resetResult()
      this.loadTestResult(nextProps.match.params.testId)
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

  onToggleAdvancedConfig = (showAdvancedConfig) => {
    this.setState({ showAdvancedConfig })
  }

  render() {
    return (
      <ResultScreenComponent
        { ...this.props }
        { ...this.state }
        onToggleAdvancedConfig={this.onToggleAdvancedConfig}
        onSubmit={this.onSubmit}
      />
    )
  }
}

ResultScreen.propTypes = {
  showInput: PropTypes.object,
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
      resetResult,
      prepareTest,
      startTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen)
