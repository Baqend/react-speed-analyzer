import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Toggle from 'react-toggle'
import CodeMirror from 'react-codemirror'

import arrow from '../../assets/arrow_right.svg'
import './ConfigForm.css'

class ConfigFormComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showAdvancedConfig: false,
    }
  }

  handleUrlChange = (changeEvent) => {
    this.props.onUrlChange(changeEvent.target.value)
  }

  handleLocationChange = (changeEvent) => {
    this.props.onLocationChange(changeEvent.target.value)
  }

  handleTimeoutChange = (changeEvent) => {
    this.props.onTimeoutChange(changeEvent.target.value)
  }

  handleSpeedKitConfigChange = (code) => {
    this.props.onSpeedKitConfigChange(code)
  }

  handleMobileSwitch = () => {
    this.props.onMobileSwitch()
  }

  handleCachingSwitch = () => {
    this.props.onCachingSwitch()
  }

  handleSubmit = (event) => {
    event.preventDefault()
    this.props.onSubmit()
  }

  renderConfig() {
    return (
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
      </div>
    )
  }

  renderAdvancedConfig() {
    return (
      <div className="advanced pv2">
        <div className="flex flex-wrap">
          <div className="flex-grow-1 flex-shrink-0" style={{ flexBasis: '50%' }}>
            <div className="ph2">
              <h5 className="mv1 text-center">WebPagetest Config</h5>
              <div className="pt1 flex items-center">
                <span className="flex-auto w-100">Mobile</span>
                <Toggle
                  className="ml1"
                  defaultChecked={this.props.config.isMobile}
                  icons={false}
                  onChange={this.handleMobileSwitch}
                />
              </div>
              <div className="pt1 flex items-center">
                <span className="flex-auto w-100">Run from US</span>
                <Toggle
                  className="ml1"
                  defaultChecked={this.props.config.location === 'us-east-1:Chrome.Native'}
                  icons={false}
                  value={this.props.config.location === 'us-east-1:Chrome.Native' ? 'EU' : 'US'}
                  onChange={this.handleLocationChange}
                />
              </div>
              <div className="pt1 flex flex-shrink-0 items-center" style={{ minWidth: '180px' }}>
                <span className="flex-shrink-0 flex-grow-1">Activity Timeout</span>
                <div className="flex-shrink-0">
                  <input type="number" className="material-input text-center mh1" value={this.props.config.activityTimeout}
                    style={{ width: '50px', marginBottom: '-2px' }} onChange={this.handleTimeoutChange}
                  />
                  <span className="">ms</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-grow-1" style={{ flexBasis: '50%' }}>
            <div className="ph2">
              <h5 className="mv1 text-center">Speed Kit Config</h5>
              <div className="pt1">
                <CodeMirror value={this.props.config.speedKitConfig} onChange={this.handleSpeedKitConfigChange}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  toggleAdvancedSettings = () => {
    this.setState({ showAdvancedConfig: !this.state.showAdvancedConfig })
  }

  render() {
    return (
      <div className="config__form flex-grow-1 flex flex-column">
        <form className="flex flex-grow-1 flex-column" onSubmit={this.handleSubmit}>
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
          {this.props.showConfig &&
            <div className="flex-grow-1 flex flex-column justify-between">
              {this.state.showAdvancedConfig ? this.renderAdvancedConfig() : this.renderConfig()}
              <div className="toggleAdvancedSettings">
                {this.state.showAdvancedConfig ? (
                  <span>
                    <a onClick={this.toggleAdvancedSettings}>Hide Advanced Settings</a>
                  </span>
                ): (
                  <span>
                    <a onClick={this.toggleAdvancedSettings}>Show Advanced Settings</a>
                  </span>
                )}
              </div>
            </div>
          }
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
  onTimeoutChange: PropTypes.func,
  onSpeedKitConfigChange: PropTypes.func,
  onCachingSwitch: PropTypes.func,
  onSubmit: PropTypes.func
}

export default ConfigFormComponent
