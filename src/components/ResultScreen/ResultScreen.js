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
      speedKitError: false,
    }
  }

  componentWillMount() {
    const testId = parse(this.props.location.search)['testId']
    if(Object.keys(this.props.competitorTest).length < 1 || Object.keys(this.props.speedKitTest).length < 1) {
      this.props.actions.monitorTest(testId)
    } else {
      if(!this.hasResultError(this.props.competitorTest, this.props.speedKitTest)) {
        // verify the main metric (speed index vs. FMP)
        this.verifyMainMetric(this.props.competitorTest.firstView, this.props.speedKitTest.firstView)
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    // change the location attribute if a new test was triggered
    const testOverview = nextProps.testOverview
    if(testOverview.competitorTestResult && testOverview.speedKitTestResult ) {
      const testId = getObjectKey(testOverview.id)
      if(nextProps.location.search.indexOf(testId) === -1) {
        nextProps.history.push(`/?testId=${testId}`)
      }
    }

    // terminate the running test as soon as both tests have finished (when reloading the page)
    if(nextProps.competitorTest.hasFinished && nextProps.speedKitTest.hasFinished) {
      this.props.actions.terminateTest()
    }

    if(Object.keys(nextProps.competitorTest).length > 0 && Object.keys(nextProps.speedKitTest).length > 0) {
      if(!this.hasResultError(nextProps.competitorTest, nextProps.speedKitTest)) {
        // verify the main metric (speed index vs. FMP) as soon as the results are available (when reloading the page)
        if(nextProps.competitorTest.firstView && nextProps.speedKitTest.firstView) {
          this.verifyMainMetric(nextProps.competitorTest.firstView, nextProps.speedKitTest.firstView)
        }
      }
    }
  }

  hasResultError = (competitorResult, speedKitResult) => {
    const mainMetric = this.state.mainMetric

    if(!competitorResult || competitorResult.testDataMissing) {
      console.log('Competitor konnte nicht getestet werden => Zeige Beispieltests')
      return true
    }

    if(!speedKitResult || speedKitResult.testDataMissing ||
      !isMainMetricSatisfactory(competitorResult.firstView[mainMetric], speedKitResult.firstView[mainMetric])) {
      console.log('SpeedKit konnte nicht getestet werden => Zeige Kontaktformular')
      this.setState({ speedKitError: true })
      return true
    }

    return false
  }

  verifyMainMetric = (competitorData, speedKitData) => {
    const mainMetric =
      shouldShowFirstMeaningfulPaint(competitorData, speedKitData) ? 'firstMeaningfulPaint' : 'speedIndex'

    this.setState({ mainMetric })
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
        speedKitError={this.state.speedKitError}
        onSubmit={this.onSubmit}
      />
    )
  }
}

ResultScreen.propTypes = {
  config: PropTypes.object.isRequired,
  testOverview: PropTypes.object.isRequired,
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    config: state.config,
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
