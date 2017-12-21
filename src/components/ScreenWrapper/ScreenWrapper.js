import React, { Component } from 'react'
import StartingScreen from '../StartingScreen/StartingScreen'
import ResultScreen from '../ResultScreen/ResultScreen'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

class ScreenWrapper extends Component {
  render() {
    if(!this.props.testRunning && this.props.testFinished) {
      return (<ResultScreen {...this.props} />)
    }

    return (<StartingScreen {...this.props} />)
  }
}

StartingScreen.propTypes = {
  testRunning: PropTypes.bool.isRequired,
  testFinished: PropTypes.bool.isRequired,

}

function mapStateToProps(state) {
  return {
    testRunning: state.result.testRunning,
    testFinished: state.result.testFinished
  }
}

export default connect(mapStateToProps)(ScreenWrapper)
