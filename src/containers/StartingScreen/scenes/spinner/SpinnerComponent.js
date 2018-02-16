import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Tooltip } from 'react-tippy'

import Carousel, {
  renderDefaultPage,
  renderIsInQueuePage,
  renderHasStartedPage,
  renderFactsPages,
} from '../../components/StatusCarousel'

import { formatFileSize } from 'helper/utils'

const dots = (
  <span className="loader">
    <span className="loader__dot">.</span>
    <span className="loader__dot">.</span>
    <span className="loader__dot">.</span>
  </span>
)

const Device = ({ children, img }) => (
  <div className="device__wrapper-outer">
    <div className="device__wrapper">
      {img && (
        <div
          className="device__background-image animated fadeIn"
          style={{ backgroundImage: `linear-gradient(rgba(17, 33, 47,0), rgba(17, 33, 47, 1) 75%), url(${img})` }}>
        </div>
      )}
      <div className="device__screen">
        {children}
      </div>
    </div>
  </div>
)

class StartingScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showCarousel: false,
      showFacts: false,
      showAdvancedConfig: props.showAdvancedConfig,
    }
  }

  onToggleAdvancedConfig = (showAdvancedConfig) => {
    this.setState({ showAdvancedConfig })
  }

  componentWillReceiveProps(nextProps) {
    // console.log(this.props, nextProps)
    if (this.props.result.statusCode !== nextProps.result.statusCode) {
      // console.log("this.props.result.statusCode !== nextProps.result.statusCode")
      clearTimeout(this.showFactsTimeout)
      this.setState({ showFacts: false }, () => {
        this.showFactsTimeout = setTimeout(() => {
          this.setState({ showFacts: true })
        }, 10000)
      })
    }
    if (!this.state.showCarousel && nextProps.result.isStarted) {
      // console.log("!this.state.showCarousel && nextProps.result.isStarted")
      const timeout = window.innerWidth <= 997 ? 500 : 2500
      setTimeout(() => this.setState({ showCarousel: true }), timeout)
    }
  }

  renderSpinner(statusMessage) {
    return (
      <div className="flex flex-column justify-center items-center" style={{ overflow: 'hidden' }}>
        <div className="spinner__wrapper animated slideInUp">
          <svg className="spinner" width="100%" height="100%" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
            <circle className="path" fill="none" strokeWidth="2" strokeLinecap="round" cx="33" cy="33" r="30"></circle>
          </svg>
        </div>
        {this.props.result.isStarted && this.renderStats()}
      </div>
    )
  }

  renderCarousel(statusMessage) {
    const pageSpeedInsights = this.props.result.testOverview && this.props.result.testOverview.psiDomains
    // pageSpeedInsights = true
    const message = (
      <div className="dn db-ns" style={{ marginTop: 16 }}>{statusMessage}</div>
    )
    return (
      <Carousel message={message}>
        {(!this.props.result.statusCode || !pageSpeedInsights) && renderDefaultPage()}
        {pageSpeedInsights && this.props.result.statusCode === 101 && renderIsInQueuePage(this.props.result.statusText)}
        {pageSpeedInsights && this.props.result.statusCode === 100 && renderHasStartedPage()}
        {pageSpeedInsights && this.state.showFacts && renderFactsPages}
      </Carousel>
    )
  }

  renderStats() {
    const psiDomains = this.props.result.testOverview && this.props.result.testOverview.psiDomains
    const psiRequests =  this.props.result.testOverview && this.props.result.testOverview.psiRequests
    const psiResponseSize = this.props.result.testOverview && this.props.result.testOverview.psiResponseSize
    // const statsClass = psiDomains && psiRequests && psiResponseSize ? 'animated zoomIn' : 'hidden'
    return (
      <div className={`flex justify-between mt2`}>
        <div className="pa2 text-center">
          <Tooltip title="Number of unique hosts referenced by the page." position="top" arrow>
            <small className="faded">Domains</small>
            <br />
            {psiDomains ? (
              <strong className="animated zoomIn">{psiDomains}</strong>
            ) : (
              <strong>{dots}</strong>
            )}
          </Tooltip>
        </div>
        <div className="pa2 text-center">
          <Tooltip title="Number of HTTP resources loaded by the page." position="top" arrow>
            <small className="faded">Requests</small>
            <br />
            {psiRequests ? (
              <strong className="animated zoomIn">{psiRequests}</strong>
            ) : (
              <strong>{dots}</strong>
            )}
          </Tooltip>
        </div>
        <div className="pa2 text-center">
          <Tooltip title="Number of uncompressed response bytes for resources on the page." position="top" arrow>
            <small className="faded">Response Size</small>
            <br />
            {psiResponseSize ? (
              <strong className="animated zoomIn">{formatFileSize(psiResponseSize, 2)}</strong>
            ) : (
              <strong>{dots}</strong>
            )}
          </Tooltip>
        </div>
      </div>
    )
  }

  render() {
    // this.state.showCarousel = true
    // this.props.result.isStarted = true
    // this.state.showFacts = true
    // this.props.result.testOverview.psiDomains = 25
    // this.props.result.testOverview.psiRequests = 111
    // this.props.result.testOverview.psiResponseSize = 2527141
    // this.props.config.isMobile = true
    // console.log(this.state.showAdvancedConfig)
    const deviceTypeClass = this.props.config.isMobile ? 'device__phone' : 'device__laptop'
    const statusClass = this.props.result.isStarted ? 'loading' : null

    const { psiScreenshot } = this.props.result.testOverview
    const img = psiScreenshot && `data:${psiScreenshot.mime_type};base64,${psiScreenshot.data.replace(/_/g, '/').replace(/-/g, '+')}`

    const statusMessage = (
      <small className="faded">
        {this.props.result.statusCode === 100 && 'Your Test has been started'}
        {this.props.result.statusCode === 101 && this.props.result.statusText.replace('...', '')}
        {dots}
      </small>
    )
    // <div className={`${this.state.showAdvancedConfig ? 'expert' : 'device'}`}>
    return (
      <div className={`expert`}>
        <div className={`${deviceTypeClass}`}>
          <Device img={img && this.props.config.isMobile ? null : img }>
            <div className="flex-grow-1 flex flex-column" style={{ overflow: 'hidden' }}>
              <div className={`flex-grow-1 flex justify-center items-center ${statusClass}`}>
                <div className="left">
                  <Device img={img && this.props.config.isMobile ? img : null }>
                    {this.renderSpinner(statusMessage)}
                  </Device>
                </div>
                <div className="right">
                  <div className="carousel flex flex-grow-1 flex-column justify-center items-stretch pa2" style={{ flexBasis: '100%' }}>
                    {this.state.showCarousel && this.renderCarousel(statusMessage)}
                  </div>
                </div>
              </div>
            </div>
          </Device>
        </div>
        {(this.props.result.statusCode === 100 || this.props.result.statusCode === 101) && (
          <div
            className="dn-ns animated fadeInDown tc"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: 8, background: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
            {statusMessage}
          </div>
        )}
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  // onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
