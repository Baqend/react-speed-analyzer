import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Toggle from 'react-toggle'

import stringifyObject from 'lib/stringify-object'
import { Controlled as CodeMirror } from 'react-codemirror2'

import { generateDefaultConfig } from '../../helper/configHelper'
import settings from 'assets/settings.svg'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'

import './ConfigForm.css'

export function splitUrl(url) {
  try {
    const dummyElement = document.createElement('a')
    dummyElement.href = url.indexOf('http') === -1 && url.indexOf('https') === -1 ? `http://${url}` : url
    let { hostname } = dummyElement
    if (hostname.indexOf('www') !== -1) {
      hostname = hostname.substr(hostname.indexOf('www.') + 4)
    }
    if (hostname && url.indexOf(hostname) !== -1 ) {
      const parts = url.split(hostname)
      return [parts[0], hostname, parts[1]]
    }
    return url
  } catch(e) {
    return url
  }
}

export const getDefaultSpeedKitConfig = (url = '', userAgentDetection = false) => (
  // eslint-disable-next-line no-eval
  eval(`(${generateDefaultConfig(url, userAgentDetection)})`)
)

class ConfigFormComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showConfig: props.showConfig,
      showAdvancedConfig: props.showAdvancedConfig,
      speedKitConfig: props.showAdvancedConfig ? stringifyObject(getDefaultSpeedKitConfig(this.props.config.url, this.props.config.mobile), { indent: '  ' }) : null,
      whiteListCandidates: [],
      restartAllowed: window.location.pathname.indexOf('/presentation') === -1,
      showCookies: window.location.search.indexOf('showCookie') !== -1,
    }
  }

  isDefaultConfig = (speedKitConfig) => speedKitConfig === stringifyObject(getDefaultSpeedKitConfig(this.props.config.url, this.props.config.mobile), { indent: '  ' })

  handleUrlChange = (changeEvent) => {
    const url = changeEvent.target.value.trim()
    this.props.onUrlChange(url)
    this.props.onCookieChange('')
    // if(splitUrl(this.props.config.url)[1] !== splitUrl(changeEvent.target.value)[1]) {
    let speedKitConfig
    if (this.state.showAdvancedConfig) {
      speedKitConfig = stringifyObject(getDefaultSpeedKitConfig(url, this.props.config.mobile), { indent: '  ' })
    } else {
      speedKitConfig = null
    }
    const whiteListCandidates = []
    this.setState({ speedKitConfig, whiteListCandidates }, () => {
      this.props.onSpeedKitConfigChange(speedKitConfig)
    })
    // }
  }

  handleCookieChange = (changeEvent) => {
    this.props.onCookieChange(changeEvent.target.value)
  }

  handleLocationChange = (changeEvent) => {
    this.props.onLocationChange(changeEvent.target.value)
  }

  handleTimeoutChange = (changeEvent) => {
    this.props.onTimeoutChange(changeEvent.target.value)
  }

  handleMobileSwitch = () => {
    this.props.onMobileSwitch()
  }

  handleCachingSwitch = () => {
    this.props.onCachingSwitch()
  }

  toggleConfig = () => {
    this.setState({ showConfig: !this.state.showConfig })
  }

  toggleAdvancedConfig = () => {
    const showAdvancedConfig = !this.state.showAdvancedConfig
    if (showAdvancedConfig) {
      let speedKitConfig
      if (!this.state.speedKitConfig) {
        speedKitConfig = stringifyObject(getDefaultSpeedKitConfig(this.props.config.url, this.props.config.mobile), { indent: '  ' })
      } else {
        speedKitConfig = this.state.speedKitConfig
      }
      this.props.onSpeedKitConfigChange(speedKitConfig)
    } else {
      this.props.onSpeedKitConfigChange(null)
    }
    this.setState({ showAdvancedConfig }, () => {
      this.props.onToggleAdvancedConfig && this.props.onToggleAdvancedConfig(showAdvancedConfig)
    })
  }

  handleWhiteListDomainClick = (e, domain) => {
    const checked = e.target.checked
    try {
      // eslint-disable-next-line no-eval
      const config = eval(`(${this.state.speedKitConfig})`)
      const hasWhitelist = !!config.whitelist
      const host = hasWhitelist ? config.whitelist[0].host : null

      if (!hasWhitelist) config.whitelist = []
      if (!config.whitelist[0]) config.whitelist[0] = { host: [] }
      if (!host) config.whitelist[0].host = []
      if (!Array.isArray(host)) config.whitelist[0].host = [host]

      if (checked) {
        config.whitelist[0].host.push(domain.url)
      } else {
        config.whitelist[0].host.splice(config.whitelist[0].host.indexOf(domain.url), 1)
      }

      const value = stringifyObject(config, { indent: '  ' })
      this.setState({ speedKitConfig: value }, () => {
        this.props.onSpeedKitConfigChange(value)
      })
    } catch (e) {
      alert("Your config seems not to be valid")
      return false
    }
  }

  handleSubmit = (event) => {
    event.preventDefault()
    if (this.state.restartAllowed) {
      this.props.onSubmit()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const nextProps = this.props
    if (nextProps.whiteListCandidates !== prevProps.whiteListCandidates) {
      this.setState({ whiteListCandidates: nextProps.whiteListCandidates })
    }

    // Compare states to avoid endless loop
    if (prevState.speedKitConfig && nextProps.config.speedKitConfig === prevState.speedKitConfig) {
      return
    }

    if ((!prevState.speedKitConfig || this.isDefaultConfig(prevState.speedKitConfig)) && nextProps.config.speedKitConfig) {
      let speedKitConfig
      try {
        // eslint-disable-next-line no-eval
        speedKitConfig = stringifyObject(eval(`(${nextProps.config.speedKitConfig})`), { indent: '  ' })
      } catch(e) {
        speedKitConfig = nextProps.config.speedKitConfig
      }
      this.setState({ speedKitConfig })
    }
  }

  renderConfig() {
    return (
      <div className="pa2">
        <div className="pt1">
          <div className="flex items-center">
            <span className="flex-auto w-100 text-right">Desktop</span>
            <Toggle
              checked={this.props.config.mobile}
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
              checked={this.props.config.location.indexOf('us-east-1') !== -1}
              icons={false}
              value={this.props.config.location.indexOf('us-east-1') !== -1 ? 'EU' : 'US'}
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
      <div className="advanced">
        <div className="flex flex-wrap">
          <div className="flex-grow-1 flex-shrink-0" style={{ flexBasis: '100%' }}>
            { this.renderConfig() }
          </div>
          <div className="flex-grow-1 flex-shrink-0" style={{ maxWidth: '100%', marginBottom: '19px' }}>
            <div>
              <h4 className="mv1 text-center">Speed Kit Config</h4>
              <div className="pt1">
                <CodeMirror
                  value={this.state.speedKitConfig}
                  options={{
                    tabSize: 2,
                  }}
                  onBeforeChange={(editor, data, value) => {
                    this.setState({ speedKitConfig: value }, () => {
                      this.props.onSpeedKitConfigChange(value)
                    })
                  }}
                />
              </div>
              {this.state.whiteListCandidates.length > 0 && (
                <div className="mt2" style={{ marginLeft: -8, marginRight: -8 }}>
                  {this.state.whiteListCandidates.map(domain => (
                    <div key={domain.url} className="checkbox-custom ma1">
                      <input id={domain.url} type="checkbox" onChange={(e) => this.handleWhiteListDomainClick(e, domain)} />
                      <label htmlFor={domain.url}>
                        {domain.url}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {this.state.showCookies && (
              <div className="pt1">
                <div className="config__form-input-wrapper">
                  <input
                    className="config__form-cookie"
                    type="text"
                    spellCheck="false"
                    value={this.props.config.cookie}
                    onChange={this.handleCookieChange}
                    placeholder="Enter cookies here"
                    noValidate
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="config__form flex-grow-1 flex flex-column">
        <form className="flex flex-grow-1 flex-column" onSubmit={this.handleSubmit} noValidate>
          <div className="config__form-input-wrapper">
            <input
              className="config__form-input"
              type="url"
              inputMode="url"
              spellCheck="false"
              value={this.props.config.url}
              onChange={this.handleUrlChange}
              placeholder="https://www.example.com"
              noValidate
            />
            <div className={`config__form-submit-wrapper ${!this.state.restartAllowed ? 'presentation' : ''} flex`}>
              {this.props.showConfigToggle && (<a onClick={this.toggleConfig} className="config__form-settings flex justify-center items-center mr1" style={{ width: 'auto', background: 'none' }}>
                <img width="24" src={settings} alt="settings" />
              </a>)}
            </div>
            {this.state.restartAllowed && <button className="config__form-submit" type="submit">START TEST</button>}
          </div>
          {this.state.showConfig &&
            <div className="mv2 flex-grow-1 flex flex-column justify-between">
              {this.state.showAdvancedConfig ? this.renderAdvancedConfig() : this.renderConfig()}
              <div className="toggleAdvancedSettings-wrapper">
                <div className="toggle">
                  <a onClick={this.toggleAdvancedConfig}>
                    Advanced Options
                    <FontAwesomeIcon icon={this.state.showAdvancedConfig ? faChevronUp : faChevronDown}
                                     style={{width: '15px', paddingLeft: '5px'}}/>
                  </a>
                </div>
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
  onCookieChange: PropTypes.func,
  onLocationChange: PropTypes.func,
  onMobileSwitch: PropTypes.func,
  onTimeoutChange: PropTypes.func,
  onSpeedKitConfigChange: PropTypes.func,
  onCachingSwitch: PropTypes.func,
  onSubmit: PropTypes.func
}

export default ConfigFormComponent
