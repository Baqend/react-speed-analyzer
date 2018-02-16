import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { prepareTest, startTest } from 'actions/startTest'
import { resetTest, monitorTest } from 'actions/monitorTest'
import { terminateTest } from 'actions/terminateTest'

import ResultScreenComponent from './ResultScreenComponent'

class ResultScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: false,
      showConfig: false,
      showAdvancedConfig: false,
    }
  }

  loadTestResult = ({ testId }) => {
    if (testId) {
      this.props.actions.monitorTest(testId)
        .catch((e) => {
          console.log(e)
        })
    }
  }

  componentWillMount() {
    this.loadTestResult(this.props)
  }

  render() {
    // <ResultScreenComponent { ...this.props } { ...this.state } onSubmit={this.onSubmit} />
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
