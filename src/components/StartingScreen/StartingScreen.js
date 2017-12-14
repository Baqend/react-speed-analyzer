import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import './StartingScreen.css'

import { getObjectKey } from '../../helper/utils'
import StartingScreenComponent from './StartingScreenComponent'
import { isURL } from '../../helper/utils'

import { normalizeUrl, checkRateLimit } from '../../actions/prepareTest'
import { getTestStatus } from '../../actions/testStatus'
import {
  createTestOverview,
  startCompetitorTest,
  startSpeedKitTest,
  subscribeOnCompetitorTestResult
} from '../../actions/startTest'


class StartingScreen extends Component {
  componentWillReceiveProps(nextProps) {
    console.log(this.props.location)
    console.log(nextProps)
  }

  onSubmit = async () => {
    if (isURL(this.props.config.url)) {
      await this.props.actions.checkRateLimit()

      if (!this.props.isRateLimited) {
        await this.props.actions.normalizeUrl(this.props.config.url, this.props.config.isMobile)

        if (!this.props.isBaqendApp) {
          await this.props.actions.createTestOverview(this.props.config)
          this.props.history.push(`?testId=${getObjectKey(this.props.testOverview)}`)
          await this.startTests()
          this.checkTestStatus(this.props.competitorTest.id)

          this.props.actions.subscribeOnCompetitorTestResult(this.props.competitorTest.id)
        }
      }
    }
  }

  /**
   * start the competitor test and the speedKit test.
   */
  startTests() {
    return Promise.all([
      // Test the competitor site
      this.props.actions.startCompetitorTest(this.props.config),
      // Test the SpeedKit site
      this.props.actions.startSpeedKitTest(this.props.config)
    ])
  }

  /**
   * Start an interval to get the status of a test.
   * @param baqendId The id of the corresponding test object.
   */
  checkTestStatus(baqendId) {
    const interval = setInterval(() => {
      this.props.actions.getTestStatus(baqendId)
        .then((status) => {
          if (status.statusCode === 100 || status.statusCode === 200) {
            clearInterval(interval)
          }
        }).catch(e => clearInterval(interval))
    }, 2000
    )
  }

  render() {
    return (
      <StartingScreenComponent
        config={this.props.config}
        isRateLimited={this.props.isRateLimited}
        isBaqendApp={this.props.isBaqendApp}
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
      checkRateLimit,
      normalizeUrl,
      createTestOverview,
      startCompetitorTest,
      startSpeedKitTest,
      getTestStatus,
      subscribeOnCompetitorTestResult
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
