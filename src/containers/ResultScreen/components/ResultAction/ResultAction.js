import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { prepareTest, startTest } from 'actions/startTest'
import { getObjectKey } from 'helper/utils'

import WordPressLogo from 'assets/wordpress.png'

class ResultAction extends Component {

  restartAnalyzer = async () => {
    const { history } = this.props
    try {
      const urlInfo = await this.props.actions.prepareTest(this.props.config.url)
      history.push('/')
      const testOverview = await this.props.actions.startTest(urlInfo)
      history.push(`/test/${getObjectKey(testOverview.id)}`)
    } catch (e) {}
  }

  // all Tests failed
  renderAllTestsFailed() {
    return (
      <div>
        <div className="text-center pb2 pt2 pt4-ns" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Test Runs Failed</h2>
          <span className="faded">An error occurred while running your tests. Please re-run the test and if the problem persists, <a style={{ cursor: 'pointer' }} onClick={this.props.toggleModal}>contact us!</a></span>
        </div>
        <div className="text-center">
          <a className="btn btn-orange btn-ghost ma1" onClick={this.restartAnalyzer}>Rerun Test</a>
        </div>
      </div>
    )
  }

  // Speedkit failed or we are not faster
  renderSpeedKitFailed() {
    return (
      <div>
        <div className="text-center pb2 pt2 pt4-ns" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Speed Kit Test Run Failed</h2>
          <span className="faded">It looks like some fine-tuning or configuration is required to measure your site. Please contact our web performance experts to adjust and re-run the test!</span>
        </div>
        <div className="text-center">
          <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
        </div>
      </div>
    )
  }

  // success for wordpress page
  renderWordpressCta() {
    return (
      <div className="flex items-center pb2 pt2 pt4-ns" style={{ maxWidth: 768, margin: '0 auto' }}>
        <div className="ph2 dn db-ns">
          <img className="pa2" height="200" src={WordPressLogo} alt="Wordpress Logo"/>
        </div>
        <div className="ph2">
          <h2 className="mb1 dn db-ns">WordPress too slow?</h2>
          <h2 className="flex items-center justify-center dn-ns tc">
            <img className="mr2" height="50" src={WordPressLogo} alt="Wordpress Logo"/>
            WordPress too slow?
          </h2>
          <div className="tc tl-ns">
            <span className="faded">One plugin that does it all: Instant response times for WordPress blogs, shops, and landing pages.</span>
          </div>
          <p className="tc tl-ns mt2">
            <a target="_blank" rel="noopener noreferrer" className="btn btn-orange" href="https://wordpress.org/plugins/baqend/">Download Plugin</a>
          </p>
        </div>
      </div>
    )
  }

  // Speedkit failed or we are not faster
  renderIsSpeedKitCta(speedKitVersion) {
    return (
      <div>
        <div className="text-center pb2 pt2 pt4-ns" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Thank you for using Speed Kit</h2>
          <span className="faded">You are running on Speed Kit {speedKitVersion}. The test therefore compared your website with Speed Kit to a version where Speed Kit is deactivated.</span>
        </div>
        <div className="text-center">
          <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
        </div>
      </div>
    )
  }

  // success
  renderCta() {
    return (
      <div className="text-center pt2 pt4-ns">
        <a className="btn btn-orange ma1"
          target="_blank" rel="noopener noreferrer"
          href="https://dashboard.baqend.com/register?appType=speedkit">Sign Up</a>
        <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
      </div>
    )
  }

  render() {
    const { competitorError, speedKitError, competitorTest, testOverview } = this.props.result
    // const speedKitError = this.props.speedKitError
    const isWordPress = competitorTest.isWordPress
    const { isSpeedKitComparison, speedKitVersion } = testOverview

    if (competitorError) {
      return this.renderAllTestsFailed()
    } else if (!competitorError && speedKitError) {
      return this.renderSpeedKitFailed()
    } else {
      if (isSpeedKitComparison) {
        return this.renderIsSpeedKitCta(speedKitVersion)
      } else if (isWordPress) {
        return this.renderWordpressCta()
      }
    }
    return this.renderCta()
  }
}

ResultAction.propTypes = {
  toggleModal: PropTypes.func,
  config: PropTypes.object,
}

function mapStateToProps(state) {
  return {
    config: state.config,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ prepareTest, startTest }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultAction)