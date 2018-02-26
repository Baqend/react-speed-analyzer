import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { loadResult } from 'actions/result'

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

  loadTestResult = async (props) => {
    const testId = this.props.testId ? this.props.testId : this.props.match.params.testId
    try {
      const testOverview = await this.props.actions.loadResult(testId)
      this.props.onAfterFinish && this.props.onAfterFinish(testOverview)
    } catch(e) {
      console.log(e)
    }
  }

  componentWillMount() {
    this.loadTestResult(this.props)
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
      loadResult,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen)
