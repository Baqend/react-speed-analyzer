import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import StartingScreenComponent from './StartingScreenComponent'
import './StartingScreen.css'

import { parse } from 'query-string'
import { getObjectKey } from '../../helper/utils'
import { isURL } from '../../helper/utils'

import { terminateTest } from '../../actions/terminateTest'
import { monitorTest } from '../../actions/monitorTest'
import { startTest } from '../../actions/startTest'


class StartingScreen extends Component {
  componentWillMount() {
    const testId = parse(this.props.location.search)['testId']
    if(testId) {
      this.props.actions.monitorTest(testId)
    }
  }

  componentWillReceiveProps(nextProps) {
    const testOverview = nextProps.testOverview
    if(testOverview.competitorTestResult && testOverview.speedKitTestResult ) {
      const testId = getObjectKey(testOverview.id)
      if(nextProps.location.search.indexOf(testId) === -1) {
        nextProps.history.push(`?testId=${testId}`)
      }
    }

    if(nextProps.location !== this.props.location) {
      const testId = parse(nextProps.location.search)['testId']
      if(testId) {
        this.props.actions.monitorTest(testId)
      }
    }

    if(nextProps.competitorTest.hasFinished && nextProps.speedKitTest.hasFinished) {
      this.props.actions.terminateTest()
      nextProps.history.push('/result' + nextProps.location.search)
    }
  }

  onSubmit = () => {
    if (isURL(this.props.config.url)) {
      this.props.actions.startTest()
    }
  }

  render() {
    return (
      <StartingScreenComponent { ...this.props } onSubmit={this.onSubmit} />
    )
  }
}

StartingScreen.propTypes = {
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
      startTest,
      monitorTest,
      terminateTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
