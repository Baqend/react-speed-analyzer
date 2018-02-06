import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ResultScreenComponent from './ResultScreenComponent'
import { parse } from 'query-string'
import { startTest } from '../../actions/startTest'
import { resetTest, monitorTest } from '../../actions/monitorTest'
import { terminateTest } from '../../actions/terminateTest'
import { isMainMetricSatisfactory, resultIsValid, shouldShowFirstMeaningfulPaint } from '../../helper/resultHelper'
import { getObjectKey, isURL, isIFrame } from '../../helper/utils'

class ResultScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      mainMetric: 'speedIndex',
      secondaryMetric: 'firstMeaningfulPaint',
      competitorError: false,
      speedKitError: false,
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
    const { competitorTest, speedKitTest } = props
    const { testOverview, isMonitored, isFinished } = props.result

    // debugger
    if (Object.keys(testOverview).length && getObjectKey(testOverview.id) !== testId) {
      // debugger
      window.scrollTo(0, 0)
      this.props.actions.resetTest()
    }

    if (testId && !isMonitored && !isFinished) {
      // debugger
      this.props.actions.monitorTest(testId).catch((e) => {
        this.props.actions.resetTest()
        // history.replace('/')
        alert("redirect to /")
      })
    }

    if(Object.keys(competitorTest).length > 0 && Object.keys(speedKitTest).length > 0) {
      // debugger
      if(!this.hasResultError(competitorTest, speedKitTest)) {
        if(competitorTest.firstView && speedKitTest.firstView) {
          this.verifyMainMetric(competitorTest.firstView, speedKitTest.firstView)
        }
      }
    }

    // if (Object.keys(competitorTest).length < 1 || Object.keys(speedKitTest).length < 1) {
    //   debugger
    //   // this.props.actions.monitorTest(testId)
    // } else {
    //   debugger
    //   if(!this.hasResultError(competitorTest, speedKitTest)) {
    //     this.verifyMainMetric(competitorTest.firstView, speedKitTest.firstView)
    //   }
    // }
  }

  componentWillMount() {
    this.checkUrlParams(this.props)
    // debugger
    this.loadTestResult(this.props)
  }

  componentWillReceiveProps(nextProps) {
    // debugger
    this.loadTestResult(nextProps)
  }

  hasResultError = (competitorResult, speedKitResult) => {
    if(!competitorResult || competitorResult.testDataMissing) {
      console.log('Competitor konnte nicht getestet werden => Zeige Beispieltests')
      this.setState({ competitorError: true })
      return true
    }

    const mainMetric = this.state.mainMetric
    const secondaryMetric = this.state.secondaryMetric
    // const resultIsSatisfying = isMainMetricSatisfactory(mainCompetitor, mainSpeedKit, secondaryCompetitor, secondarySpeedKit)
    const isValidResult = resultIsValid(competitorResult, speedKitResult, mainMetric, secondaryMetric)

    if(!speedKitResult || speedKitResult.testDataMissing || !isValidResult) {
      console.log('SpeedKit konnte nicht getestet werden => Zeige Kontaktformular')
      this.setState({ speedKitError: true })
      return true
    }

    return false
  }

  verifyMainMetric = (competitorData, speedKitData) => {
    const mainMetric = shouldShowFirstMeaningfulPaint(competitorData, speedKitData) ? 'firstMeaningfulPaint' : 'speedIndex'
    const secondaryMetric = shouldShowFirstMeaningfulPaint(competitorData, speedKitData) ? 'speedIndex' : 'firstMeaningfulPaint'
    this.setState({ mainMetric, secondaryMetric })
  }

  onSubmit = () => {
    if (isURL(this.props.config.url)) {
      this.props.actions.startTest()
    }
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
      startTest,
      resetTest,
      monitorTest,
      terminateTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen)
