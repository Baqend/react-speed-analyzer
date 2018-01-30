import React, { Component } from 'react'
import PropTypes from 'prop-types'

import WordPressLogo from '../../../assets/wordpress.png'

class ResultAction extends Component {

  // all Tests failed
  renderAllTestsFailed() {
    return (
      <div>
        <div className="text-center pb2 pt4" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Ooooops All Tests Failed</h2>
          <strong>It looks like some fine tuning or configuration is required to measure your site. Please contact our web performance experts for further information and assistance!</strong>
        </div>
        <div className="text-center">
          <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
        </div>
      </div>
    )
  }

  // Speedkit failed or we are not faster
  renderSpeedKitFailed() {
    return (
      <div>
        <div className="text-center pb2 pt4" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Ooooops Speed Kit Failed</h2>
          <strong>It looks like some fine tuning or configuration is required to measure your site. Please contact our web performance experts for further information and assistance!</strong>
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
          <h2 className="mb1 dn db-ns">WordPress Plugin</h2>
          <h2 className="flex items-center justify-center dn-ns tc">
            <img className="mr2" height="50" src={WordPressLogo} alt="Wordpress Logo"/>
            WordPress Plugin
          </h2>
          <div className="tc tl-ns">
            <strong className="faded">The WordPress-Plugin makes installing Speed Kit a one-click experience</strong>
          </div>
          <p className="tc tl-ns mt2">
            <a target="_blank" rel="noopener noreferrer" className="btn btn-orange" href="https://wordpress.org/plugins/baqend/">Download Plugin</a>
          </p>
        </div>
      </div>
    )
  }

  // success
  renderCta() {
    return (
      <div className="text-center">
        <a href="" className="btn btn-orange ma1">Boost Your Website</a>
        <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
      </div>
    )
  }

  render() {
    const competitorError = this.props.competitorError
    const speedKitError = this.props.speedKitError
    console.log(this.props)
    return (
      <div>
        {competitorError && this.renderAllTestsFailed()}
        {!competitorError && speedKitError && this.renderSpeedKitFailed()}
        {!competitorError && !speedKitError && (
          <div>
            {this.props.competitorTest.isWordPress ? this.renderWordpressCta() : this.renderCta()}
          </div>
        )}
      </div>
    )
  }
}

ResultAction.propTypes = {
  toggleModal: PropTypes.func,
}

export default ResultAction
