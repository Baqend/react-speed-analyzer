import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import StartingScreenComponent from './StartingScreenComponent'
import { getObjectKey } from '../../helper/utils'

import { handleUrlInput, handleLocationChange, handleMobileSwitch, handleCachingSwitch } from '../../actions/config'
import { normalizeUrl, checkRateLimit } from '../../actions/prepareTest'
import { createTestOverview, startCompetitorTest, startSpeedKitTest } from '../../actions/startTest'


class StartingScreen extends Component {
  onUrlChange = (data) => {
    this.props.actions.handleUrlInput(data)
  }

  onLocationChange = (data) => {
    this.props.actions.handleLocationChange(data)
  }

  onMobileSwitch = () => {
    this.props.actions.handleMobileSwitch(this.props.mobile)
  }

  onCachingSwitch = () => {
    this.props.actions.handleCachingSwitch(this.props.caching)
  }

  onSubmit = async () => {
    // check whether the user has typed in an input
    if (this.props.config.url.length > 0) {
      // test if the user is allowed (not rate limited) to start a new test
      await this.props.actions.checkRateLimit()

      // the user is not rate limited => a new test is allowed
      if (!this.props.isRateLimited) {
        // normalize the user input and get further information (is baqend app etc.) of the website
        await this.props.actions.normalizeUrl(this.props.config.url, this.props.config.isMobile)

        // the website is not a baqend app
        if (!this.props.isBaqendApp) {
          // create a new testOverview object with uniqueId (input url required for id)
          await this.props.actions.createTestOverview(this.props.config)

          // add test id as a query parameter
          this.props.history.push(`?testId=${getObjectKey(this.props.testOverview)}`)

          // start competitor test and speed kit test
          await this.startTests()
        }
      }
    }
  }

  startTests() {
    return Promise.all([
      // Test the competitor site
      this.props.actions.startCompetitorTest(this.props.config),
      // Test the SpeedKit site
      this.props.actions.startSpeedKitTest(this.props.config)
    ])
  }

  render() {
    return (
      <StartingScreenComponent
        config={this.props.config}
        isRateLimited={this.props.isRateLimited}
        isBaqendApp={this.props.isBaqendApp}
        onUrlChange={this.onUrlChange}
        onLocationChange={this.onLocationChange}
        onMobileSwitch={this.onMobileSwitch}
        onCachingSwitch={this.onCachingSwitch}
        onSubmit={this.onSubmit}
      />
    )
  }
}

StartingScreen.propTypes = {
  testOverview: PropTypes.object,
  actions: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  isRateLimited: PropTypes.bool.isRequired,
  isBaqendApp: PropTypes.bool.isRequired,
  competitorTest: PropTypes.object,
  speedKitTest: PropTypes.object
}

function mapStateToProps(state) {
  return {
    testOverview: state.result.testOverview,
    config: state.config,
    isRateLimited: state.result.isRateLimited,
    isBaqendApp: state.result.isBaqendApp,
    competitorTest: state.result.competitorTest,
    speedKitTest: state.speedKitTest,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      handleUrlInput,
      handleLocationChange,
      handleMobileSwitch,
      handleCachingSwitch,
      checkRateLimit,
      normalizeUrl,
      createTestOverview,
      startCompetitorTest,
      startSpeedKitTest
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
