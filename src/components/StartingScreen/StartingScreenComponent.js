import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ConfigForm from '../ConfigForm/ConfigForm'

import { Carousel } from './StatusCarousel/Carousel'
import {
  renderDefaultPage,
  renderIsInQueuePage,
  renderHasStartedPage,
  renderFactsPages,
} from './StatusCarousel/Pages'

const Device = ({ children }) => (
  <div className="device__wrapper-outer">
    <div className="device__wrapper">
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
      showAdvancedConfig: true,
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.result.statusCode !== nextProps.result.statusCode) {
      this.setState({ showFacts: false }, () => setTimeout(() => {
        this.setState({ showFacts: true })
      }, 6000))
    }
    if (nextProps.result.isStarted) {
      setTimeout(() => this.setState({ showCarousel: true }), 2500)
    }
  }

  renderForm() {
    return (
      <div className="flex-grow-1 flex flex-column justify-center" style={{ overflow: 'hidden' }}>
        <div className="text-center flex-grow-1 flex flex-column justify-end">
          <h1 className="mv2">Page Speed Analyzer</h1>
          <span>Test the performance of your site!</span>
        </div>
        <div className="mt4 flex-grow-1 flex flex-column">
          <ConfigForm
            config={this.props.config}
            showConfig={true}
            showAdvancedConfig={this.state.showAdvancedConfig}
            onSubmit={this.props.onSubmit}
          />
        </div>
      </div>
    )
  }

  renderSpinner() {
    return (
      <div className="flex flex-column items-center" style={{ overflow: 'hidden' }}>
        <div className="spinner__wrapper animated slideInUp">
          <svg className="spinner" width="100%" height="100%" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
            <circle className="path" fill="none" strokeWidth="2" strokeLinecap="round" cx="33" cy="33" r="30"></circle>
          </svg>
        </div>
        {this.props.result.isStarted && this.renderStats()}
      </div>
    )
  }

  renderCarousel() {
    return (
      <Carousel>
        {!this.props.result.statusCode && renderDefaultPage()}
        {this.props.result.statusCode === 101 && renderIsInQueuePage(this.props.result.statusText)}
        {this.props.result.statusCode === 100 && renderHasStartedPage()}
        {this.state.showFacts && renderFactsPages}
      </Carousel>
    )
  }

  renderStats() {
    const psiDomains = this.props.result.testOverview && this.props.result.testOverview.psiDomains
    const psiRequests =  this.props.result.testOverview && this.props.result.testOverview.psiRequests
    const psiResponseSize = this.props.result.testOverview && this.props.result.testOverview.psiResponseSize
    // const statsClass = psiDomains && psiRequests && psiResponseSize ? 'animated zoomIn' : 'hidden'
    return (
      <div className={`flex justify-between mt4`}>
        <div className="pa2 text-center">
          <small className="faded">Domains</small>
          <br />
          {psiDomains ? (
            <strong className="animated zoomIn">{psiDomains}</strong>
          ) : (
            <strong>-</strong>
          )}
        </div>
        <div className="pa2 text-center">
          <small className="faded">Requests</small>
          <br />
          {psiRequests ? (
            <strong className="animated zoomIn">{psiRequests}</strong>
          ) : (
            <strong>-</strong>
          )}
        </div>
        <div className="pa2 text-center">
          <small className="faded">Response Size</small>
          <br />
          {psiResponseSize ? (
            <strong className="animated zoomIn">{psiResponseSize}</strong>
          ) : (
            <strong>-</strong>
          )}
        </div>
      </div>
    )
  }

  toggleAdvancedSettings = () => {
    this.setState({ showAdvancedConfig: !this.state.showAdvancedConfig })
  }

  render() {
    // this.state.showCarousel = true
    // this.props.result.isStarted = true
    // this.props.result.testOverview.psiDomains = 25
    // this.props.result.testOverview.psiRequests = 111
    // this.props.result.testOverview.psiResponseSize = 2527141
    // this.props.config.isMobile = true

    const deviceTypeClass = this.props.config.isMobile ? 'device__phone' : 'device__laptop'
    const statusClass = this.props.result.isStarted ? 'loading' : null
    return (
      <div className="device">
        <div className={`${deviceTypeClass}`}>
          <Device>
            <div className="flex-grow-1 flex flex-column">
              <div className={`flex-grow-1 flex justify-center ${statusClass}`}>
                <div className="left">
                  <Device>
                    {(this.props.result.isStarted && this.renderSpinner()) || this.renderForm()}
                  </Device>
                </div>
                {this.props.result.isStarted &&
                  <div className="right">
                    <div className="flex flex-grow-1 flex-column justify-center items-stretch pa2">
                      {this.state.showCarousel && this.renderCarousel()}
                    </div>
                  </div>
                }
              </div>
            </div>
          </Device>
        </div>
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
