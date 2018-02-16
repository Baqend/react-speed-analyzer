import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ResultScreenComponent from './ResultScreenComponent'

import { prepareTest, startTest } from 'actions/startTest'
import { resetTest, monitorTest } from 'actions/monitorTest'
import { terminateTest } from 'actions/terminateTest'

import { getObjectKey, isIFrame } from 'helper/utils'

class ResultScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: false,
      showConfig: false,
      showAdvancedConfig: false,
      isIFrame: isIFrame(),
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

  loadTestResult = (props) => {
    const { match } = props
    const { testId } = match.params
    const { testOverview, isStarted, isFinished } = props.result

    if (Object.keys(testOverview).length && getObjectKey(testOverview.id) !== testId) {
      window.scrollTo(0, 0)
      this.props.actions.resetTest()
    }

    if (testId && !isStarted && !isFinished) {
      const { history } = this.props
      this.props.actions.monitorTest(testId).catch((e) => {
        this.props.actions.resetTest()
        history.replace('/')
      })
    }
  }

  componentWillMount() {
    this.checkUrlParams(this.props)
    this.loadTestResult(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.loadTestResult(nextProps)
  }

  onSubmit = async () => {
    const { history } = this.props
    try {
      const urlInfo = await this.props.actions.prepareTest(this.props.config.url)
      history.push('/')
      const testOverview = await this.props.actions.startTest(urlInfo)
      history.push(`/test/${getObjectKey(testOverview.id)}`)
    } catch (e) {}
  }

  render() {
    return (
      <ResultScreenComponent { ...this.props } { ...this.state } onSubmit={this.onSubmit} />
    )
  }
}

ResultScreen.propTypes = {
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
      prepareTest,
      startTest,
      resetTest,
      monitorTest,
      terminateTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen)
