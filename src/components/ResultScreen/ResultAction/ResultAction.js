import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { startTest } from '../../../actions/startTest'
import { isURL } from '../../../helper/utils'

import WordPressLogo from '../../../assets/wordpress.png'

class ResultAction extends Component {

  restartAnalyzer = () => {
    if (isURL(this.props.config.url)) {
      this.props.actions.startTest()
    }
  }

  // all Tests failed
  renderAllTestsFailed() {
    return (
      <div>
        <div className="text-center pb2 pt4" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Test Runs Failed</h2>
          <strong>An error occurred while running your tests. Please re-run the test and if the problem persists, <a href="">contact us!</a></strong>
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
        <div className="text-center pb2 pt4" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Speed Kit Test Run Failed</h2>
          <strong>It looks like some fine-tuning or configuration is required to measure your site. Please contact our web performance experts to adjust and re-run the test!</strong>
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
      <div className="flex items-center pb2 pt4" style={{ maxWidth: 768, margin: '0 auto' }}>
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
            <strong className="faded">One plugin that does it all: Instant response times for WordPress blogs, shops, and landing pages.</strong>
          </div>
          <p className="tc tl-ns mt2">
            <a target="_blank" rel="noopener noreferrer" className="btn btn-orange" href="https://wordpress.org/plugins/baqend/">Download Plugin</a>
          </p>
        </div>
      </div>
    )
  }

  // Speedkit failed or we are not faster
  renderIsSpeedKitCta() {
    return (
      <div>
        <div className="text-center pb2 pt4" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Thank you for using Speed Kit</h2>
          <strong>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam porta sem malesuada magna mollis euismod.</strong>
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
      <div className="text-center pt4">
        <a href="" className="btn btn-orange ma1">Boost Your Website</a>
        <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
      </div>
    )
  }

  render() {
    const competitorError = this.props.competitorError
    const speedKitError = this.props.speedKitError
    const isWordPress = this.props.competitorTest.isWordPress
    const isSpeedKitComparison = this.props.result.isSpeedKitComparison

    if (competitorError) {
      return this.renderAllTestsFailed()
    } else if (!competitorError && speedKitError) {
      return this.renderSpeedKitFailed()
    } else {
      if (isSpeedKitComparison) {
        return this.renderIsSpeedKitCta()
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
    actions: bindActionCreators({ startTest }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultAction)
