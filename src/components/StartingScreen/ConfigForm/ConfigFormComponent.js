import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Toggle from 'react-toggle'

import arrow from '../../../assets/arrow_right.svg'
import './ConfigForm.css'

class ConfigFormComponent extends Component {

  handleUrlChange = (changeEvent: any) => {
    this.props.onUrlChange(changeEvent.target.value)
  }

  handleLocationChange = (changeEvent: any) => {
    this.props.onLocationChange(changeEvent.target.value)
  }

  handleMobileSwitch = () => {
    this.props.onMobileSwitch()
  }

  handleCachingSwitch = () => {
    this.props.onCachingSwitch()
  }

  handleSubmit = (event: any) => {
    event.preventDefault()
    this.props.onSubmit()
  }

  render() {
    return (
      <div className="pa4 config__form">
        <form onSubmit={this.handleSubmit}>
          <div className="config__form-input-wrapper">
            <input
              className="w-100 ph2 pv3 config__form-input"
              type="text"
              inputMode="url"
              spellCheck="false"
              value={this.props.config.url}
              onChange={this.handleUrlChange}
              placeholder="Enter URL here..."
            />
            <div className="config__form-submit-wrapper">
              <button className="config__form-submit flex justify-center items-center" type="submit">
                {this.props.isInitiated ? (
                  <div className="spinner__wrapper" style={{ width: '25px', height: '25px' }}>
                    <svg className="spinner" width="100%" height="100%" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                      <circle className="path" fill="none" strokeWidth="6" strokeLinecap="round" cx="33" cy="33" r="30"></circle>
                    </svg>
                  </div>
                ) : (
                  <img src={arrow} alt="arrow"/>
                )}
              </button>
            </div>
          </div>
          <div className="pa1">
            <div className="pt1">
              <div className="flex items-center">
                <span className="flex-auto w-100 text-right">Desktop</span>
                <Toggle
                  className="mh1"
                  defaultChecked={this.props.config.isMobile}
                  icons={false}
                  onChange={this.handleMobileSwitch}
                />
                <span className="flex-auto w-100">Mobile</span>
              </div>
            </div>
            <div className="pt1">
              <div className="flex items-center">
                <span className="flex-auto w-100 text-right">EU</span>
                <Toggle
                  className="mh1"
                  defaultChecked={this.props.config.location === 'us-east-1:Chrome.Native'}
                  icons={false}
                  value={this.props.config.location === 'us-east-1:Chrome.Native' ? 'EU' : 'US'}
                  onChange={this.handleLocationChange}
                />
                <span className="flex-auto w-100">USA</span>
              </div>
            </div>
            {/*<div className="pt1">
              <div className="flex items-center">
                <span className="flex-auto w-100 text-right">No Cache</span>
                <Toggle
                  className="mh1"
                  defaultChecked={this.props.config.caching}
                  icons={false}
                  onChange={this.handleCachingSwitch}
                />
                <span className="flex-auto w-100">Cache</span>
              </div>
            </div>
            */}
          </div>
        </form>
      </div>
    )
  }
}

ConfigFormComponent.propTypes = {
  config: PropTypes.object,
  onUrlChange: PropTypes.func,
  onLocationChange: PropTypes.func,
  onMobileSwitch: PropTypes.func,
  onCachingSwitch: PropTypes.func,
  onSubmit: PropTypes.func
}

export default ConfigFormComponent
