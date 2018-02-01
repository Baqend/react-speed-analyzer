import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ResultScreenComponent from './ResultScreenComponent'
import { parse } from 'query-string'
import { startTest } from '../../actions/startTest'
import { monitorTest } from '../../actions/monitorTest'
import { terminateTest } from '../../actions/terminateTest'
import { isMainMetricSatisfactory, shouldShowFirstMeaningfulPaint } from '../../helper/resultHelper'
import { getObjectKey, isURL } from '../../helper/utils'

class ResultScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      mainMetric: 'speedIndex',
      secondaryMetric: 'firstMeaningfulPaint',
      competitorError: false,
      speedKitError: false,
    }
  }

  componentWillMount() {
    const testId = parse(this.props.location.search)['testId']
    const competitorTest = this.props.competitorTest
    const speedKitTest = this.props.speedKitTest

    if(Object.keys(competitorTest).length < 1 || Object.keys(speedKitTest).length < 1) {
      this.props.actions.monitorTest(testId)
    } else {
      if(!this.hasResultError(competitorTest, speedKitTest)) {
        this.verifyMainMetric(competitorTest.firstView, speedKitTest.firstView)
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    // change the location attribute if a new test was triggered
    const testOverview = nextProps.testOverview
    const competitorTest = nextProps.competitorTest
    const speedKitTest = nextProps.speedKitTest

    if(testOverview.competitorTestResult && testOverview.speedKitTestResult ) {
      const testId = getObjectKey(testOverview.id)
      if(nextProps.location.search.indexOf(testId) === -1) {
        nextProps.history.push(`/?testId=${testId}`)
      }
    }

    // terminate the running test as soon as both tests have finished (when reloading the page)
    if(competitorTest.hasFinished && speedKitTest.hasFinished) {
      this.props.actions.terminateTest()
    }

    if(Object.keys(competitorTest).length > 0 && Object.keys(speedKitTest).length > 0) {
      if(!this.hasResultError(competitorTest, speedKitTest)) {
        if(competitorTest.firstView && speedKitTest.firstView) {
          this.verifyMainMetric(competitorTest.firstView, speedKitTest.firstView)
        }
      }
    }
  }

  hasResultError = (competitorResult, speedKitResult) => {

    if(!competitorResult || competitorResult.testDataMissing) {
      console.log('Competitor konnte nicht getestet werden => Zeige Beispieltests')
      this.setState({ competitorError: true })
      return true
    }

    const mainMetric = this.state.mainMetric
    const secondaryMetric = this.state.secondaryMetric

    const mainCompetitor = competitorResult.firstView[mainMetric]
    const mainSpeedKit = speedKitResult.firstView[mainMetric]
    const secondaryCompetitor = competitorResult.firstView[secondaryMetric]
    const secondarySpeedKit = speedKitResult.firstView[secondaryMetric]

    const resultIsSatisfying = isMainMetricSatisfactory(mainCompetitor, mainSpeedKit, secondaryCompetitor, secondarySpeedKit)

    if(!speedKitResult || speedKitResult.testDataMissing || !resultIsSatisfying) {
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
      <ResultScreenComponent
        { ...this.props }
        mainMetric={this.state.mainMetric}
        competitorError={this.state.competitorError}
        speedKitError={this.state.speedKitError}
        onSubmit={this.onSubmit}
      />
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
      monitorTest,
      terminateTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen)
