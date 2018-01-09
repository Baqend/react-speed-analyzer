import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ResultScreenComponent from './ResultScreenComponent'
import { parse } from 'query-string'
import { monitorTest } from '../../actions/monitorTest'
import { isDeviceIOS } from '../../helper/utils'

class ResultScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    const testId = parse(this.props.location.search)['testId']
    if(Object.keys(this.props.competitorTest).length < 1 || Object.keys(this.props.speedKitTest).length < 1) {
      this.props.actions.monitorTest(testId)
    }
  }

  onSubmit() {
  }

  render() {
    return (
      <ResultScreenComponent
        { ...this.props }
        state={this.state}
        onSubmit={this.onSubmit}
      />
    )
  }
}

ResultScreen.propTypes = {
  config: PropTypes.object.isRequired,
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    config: state.config,
    competitorTest: state.result.competitorTest,
    speedKitTest: state.result.speedKitTest,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      monitorTest
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen)
