import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import StartingScreenComponent from './StartingScreenComponent'

import { handleUrlInput, handleLocationChange, handleMobileSwitch, handleCachingSwitch } from '../../actions/config'
import { testRateLimit } from '../../actions/rateLimiter'
import { normalizeUrl } from '../../actions/normalizeUrl'
import { generateSpeedKitConfig } from '../../actions/speedKitUrl'
import { startCompetitorTest, startSpeedKitTest } from '../../actions/startTest'
import {
  createTestOverview,
  saveTestOverview,
  updateURL,
  updateIsMobile,
  updateWhitelist,
  updateCaching
} from '../../actions/testOverview'

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
    if (this.props.url.length > 0) {
      // test if the user is allowed (not rate limited) to start a new test
      await this.props.actions.testRateLimit()

      // the user is not rate limited => a new test is allowed
      if (!this.props.isRateLimited) {
        // normalize the user input and get further information (is baqend app etc.) of the website
        await this.props.actions.normalizeUrl(this.props.url, this.props.isMobile)

        // the website is not a baqend app
        if (!this.props.isBaqendApp) {
          // create a new testOverview object with uniqueId (input url required for id)
          await this.props.actions.createTestOverview(this.props.url)

          // generate the speedKit config based on the config params
          this.props.actions.generateSpeedKitConfig(this.props.url, this.props.whitelist, this.props.isMobile)

          // transfer relevant config variable to the testOverview
          this.props.actions.updateURL(this.props.url)
          this.props.actions.updateIsMobile(this.props.isMobile)
          this.props.actions.updateWhitelist(this.props.whitelist)
          this.props.actions.updateCaching(this.props.caching)

          await Promise.all([
            // Test the competitor site
            this.props.actions.startCompetitorTest(
              this.props.url,
              this.props.isSpeedKitComparison,
              this.props.location,
              this.props.caching,
              this.props.isMobile
            ),
            // Test the SpeedKit site
            this.props.actions.startSpeedKitTest(
              this.props.url,
              this.props.isSpeedKitComparison,
              this.props.speedKitConfig,
              this.props.location,
              this.props.caching,
              this.props.isMobile
            )
          ])

          // save the updated testOverview
          await this.props.actions.saveTestOverview(this.props.testOverview)
        }
      }
    }
  }

  render() {
    return (
      <StartingScreenComponent
        url={this.props.url}
        location={this.props.location}
        isMobile={this.props.isMobile}
        caching={this.props.caching}
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
  url: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  isMobile: PropTypes.bool.isRequired,
  isSpeedKitComparison: PropTypes.bool,
  caching: PropTypes.bool.isRequired,
  whitelist: PropTypes.string.isRequired,
  speedKitConfig: PropTypes.string,
  isRateLimited: PropTypes.bool.isRequired,
  isBaqendApp: PropTypes.bool.isRequired,
  competitorTestId: PropTypes.string,
  speedKitTestId: PropTypes.string
}

function mapStateToProps(state) {
  return {
    testOverview: state.testOverview.testOverview,
    url: state.config.url,
    location: state.config.location,
    isMobile: state.config.isMobile,
    caching: state.config.caching,
    isSpeedKitComparison: state.config.isSpeedKitComparison,
    whitelist: state.config.whitelist,
    speedKitConfig: state.config.speedKitConfig,
    isRateLimited: state.error.isRateLimited,
    isBaqendApp: state.error.isBaqendApp,
    competitorTestId: state.competitorTestResult.testId,
    speedKitTestId: state.speedKitTestResult.testId
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      handleUrlInput,
      handleLocationChange,
      handleMobileSwitch,
      handleCachingSwitch,
      testRateLimit,
      normalizeUrl,
      createTestOverview,
      saveTestOverview,
      updateURL,
      updateIsMobile,
      updateWhitelist,
      updateCaching,
      generateSpeedKitConfig,
      startCompetitorTest,
      startSpeedKitTest
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
