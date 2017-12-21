import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import './StartingScreen.css'

import { parse } from 'query-string'
import { getObjectKey } from '../../helper/utils'
import StartingScreenComponent from './StartingScreenComponent'
import { isURL } from '../../helper/utils'

import { normalizeUrl, checkRateLimit } from '../../actions/prepareTest'
import { getTestStatus } from '../../actions/testStatus'
import { updateConfigByTestOverview } from '../../actions/config'
import {
  createTestOverview,
  loadTestOverviewByTestId,
  saveTestOverview,
  startCompetitorTest,
  startSpeedKitTest,
  subscribeOnCompetitorTestResult,
  subscribeOnSpeedKitTestResult,
} from '../../actions/startTest'


class StartingScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      competitorSubscription: null,
      speedKitSubscription: null,
    }
  }

  componentWillMount() {
    const testId = parse(this.props.location.search)['testId']
    this.watchTestById(testId)
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.location !== this.props.location) {
      const testId = parse(nextProps.location.search)['testId']
      this.watchTestById(testId)
    }
  }

  onSubmit = async () => {
    if (isURL(this.props.config.url)) {
      await this.props.actions.checkRateLimit()

      if (!this.props.isRateLimited) {
        await this.props.actions.normalizeUrl(this.props.config.url, this.props.config.isMobile)

        if (!this.props.isBaqendApp) {
          await this.props.actions.createTestOverview(this.props.config)
          await this.startTests()
          const testId = getObjectKey(this.props.testOverview.id)
          this.props.history.push(`?testId=${testId}`)
        }
      }
    }
  }

  /**
   * Subscribe on tests based on the given testId and watch their status
   * @param testId The id of the test (testOverview) to be watched
   */
  async watchTestById(testId) {
    if (testId) {
      if (!this.props.testOverview) {
        await this.props.actions.loadTestOverviewByTestId(testId)
      }
      
      const competitorResult = this.props.testOverview.competitorTestResult
      const speedKitResult = this.props.testOverview.speedKitTestResult

      this.props.actions.updateConfigByTestOverview(this.props.testOverview)
      this.checkTestStatus(getObjectKey(competitorResult))
      await this.subscribeOnTestResults(competitorResult, speedKitResult)

      this.checkSubscriptionTermination(this.props.competitorTest, this.props.speedKitTest)
    }
  }

  /**
   * start the competitor test and the speedKit test.
   */
  startTests() {
    return Promise.all([
      this.props.actions.startCompetitorTest(this.props.config),
      this.props.actions.startSpeedKitTest(this.props.config),
    ]).then(() => this.props.actions.saveTestOverview(this.props.testOverview))
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
    }, 2000,
    )
  }

  /**
   * Subscribe on the given testResult objects.
   * @param competitorResult The competitor test object.
   * @param speedKitResult The speedKit test object.
   * @returns {Promise.<void>}
   */
  async subscribeOnTestResults(competitorResult, speedKitResult) {
    // Needs to be implemented synchronously because Reacts setState() works asynchronous
    // and therefore would generate an endless loop in combination with our use of componentWillReceiveProps()
    if (!this.state.competitorSubscription) {
      this.state.competitorSubscription = await this.props.actions.subscribeOnCompetitorTestResult(competitorResult)
    }
    if (!this.state.speedKitSubscription) {
      this.state.speedKitSubscription = await this.props.actions.subscribeOnSpeedKitTestResult(speedKitResult)
    }
  }

  /**
   * Check whether te single subscriptions can be unsubscribed.
   * @param competitorResult The competitorTestResult object.
   * @param speedKitResult The speedKitTestResult object.
   */
  checkSubscriptionTermination(competitorResult, speedKitResult) {
    const competitorSubscription = this.state.competitorSubscription
    const speedKitSubscription = this.state.speedKitSubscription

    if (competitorResult && competitorResult.hasFinished && competitorSubscription) {
      competitorSubscription.unsubscribe()
      this.setState({ competitorSubscription: null })
    }
    if (speedKitResult && speedKitResult.hasFinished && speedKitSubscription) {
      speedKitSubscription.unsubscribe()
      this.setState({ speedKitSubscription: null })
    }
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
  speedKitTest: PropTypes.object,
}

function mapStateToProps(state) {
  return {
    testOverview: state.result.testOverview,
    config: state.config,
    isRateLimited: state.result.isRateLimited,
    isBaqendApp: state.result.isBaqendApp,
    competitorTest: state.result.competitorTest,
    speedKitTest: state.result.speedKitTest,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      checkRateLimit,
      normalizeUrl,
      createTestOverview,
      loadTestOverviewByTestId,
      saveTestOverview,
      startCompetitorTest,
      startSpeedKitTest,
      getTestStatus,
      subscribeOnCompetitorTestResult,
      subscribeOnSpeedKitTestResult,
      updateConfigByTestOverview,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
