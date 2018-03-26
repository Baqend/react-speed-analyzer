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
    this.state = {
      showDetails: false,
      showConfig: false,
      showAdvancedConfig: false
    }
  }

  checkUrlParams = (props) => {
    const params = this.props.location.search.replace('?', '').split('&')
    this.setState({
      showDetails: params.indexOf('details') > -1,
      showConfig: params.indexOf('config') > -1 || params.indexOf('advanced') > -1,
      showAdvancedConfig: params.indexOf('advanced') > -1,
    })
  }

  loadTestResult = async (testId) => {
    try {
      await this.props.actions.loadResult(testId)
    } catch(e) {
      console.log(e)
    }
  }

  componentWillMount() {
    const { testId } = this.props.match.params
    this.checkUrlParams(this.props)
    testId && this.loadTestResult(testId)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.match.params.testId !== nextProps.match.params.testId) {
      window.scrollTo(0, 0)
      this.props.actions.resetResult()
      this.loadTestResult(nextProps.match.params.testId)
    }
  }

  onSubmit = async () => {
    const { history } = this.props
    const useAdvancedConfig = this.state.showAdvancedConfig
    try {
      const urlInfo = await this.props.actions.prepareTest(this.props.config.url)
      const testOverview = await this.props.actions.startTest(urlInfo, useAdvancedConfig)
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
