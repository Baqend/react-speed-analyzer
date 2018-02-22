import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Toggle from 'react-toggle'
// import CodeMirror from 'react-codemirror'
import stringifyObject from 'lib/stringify-object'
import { Controlled as CodeMirror } from 'react-codemirror2'

import { getTLD } from '../../helper/configHelper'
import Spinner from 'components/Spinner'

import arrow from '../../assets/arrow_right.svg'
import './ConfigForm.css'

export function splitUrl(url) {
  try {
    // if(url.indexOf('http') === -1 && url.indexOf('https') === -1) {
    //   // url = `http://${url}`
    //   return url
    // }
    const dummyElement = document.createElement('a')
    dummyElement.href = url.indexOf('http') === -1 && url.indexOf('https') === -1 ? `http://${url}` : url
    let { hostname } = dummyElement
    // Remove "www" in the beginning
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

export const getDefaultSpeedKitConfig = (url = '') => ({
  appName: "makefast",
  whitelist: [
    { host: [ `${getTLD(url)}` ] }
  ]
})

class ConfigFormComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showAdvancedConfig: props.showAdvancedConfig,
      speedKitConfig: props.showAdvancedConfig ? stringifyObject(getDefaultSpeedKitConfig(this.props.config.url), { indent: '  ' }) : null,
      whiteListCandidates: [],
    }
    // console.log(stringifyObject(this.state.speedKitConfig, { indent: '  ' }))
    // const obj = eval(`(${this.state.speedKitConfig})`)
    // console.log(obj)
    // debugger
  }

  handleUrlChange = (changeEvent) => {
    this.props.onUrlChange(changeEvent.target.value)

    if(splitUrl(this.props.config.url)[1] !== splitUrl(changeEvent.target.value)[1]) {
      let speedKitConfig
      if (this.state.showAdvancedConfig) {
        speedKitConfig = stringifyObject(getDefaultSpeedKitConfig(changeEvent.target.value), { indent: '  ' })
      } else {
        speedKitConfig = null
      }
      const whiteListCandidates = []
      this.setState({ speedKitConfig, whiteListCandidates }, () => {
        this.props.onSpeedKitConfigChange(speedKitConfig)
      })
    }
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

  toggleAdvancedConfig = () => {
    const showAdvancedConfig = !this.state.showAdvancedConfig
    if (showAdvancedConfig) {
      let speedKitConfig
      if (!this.state.speedKitConfig) {
        speedKitConfig = stringifyObject(getDefaultSpeedKitConfig(this.props.config.url), { indent: '  ' })
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

      if (!config.whitelist) config.whitelist = []
      if (!config.whitelist[0]) config.whitelist[0] = { host: [] }
      if (!config.whitelist[0].host) config.whitelist[0].host = []

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
      alert("Your config JSON seems not to be valid")
      return false
    }
  }

  handleSubmit = (event) => {
    event.preventDefault()
    this.props.onSubmit()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.whiteListCandidates !== this.props.whiteListCandidates) {
      this.setState({ whiteListCandidates: nextProps.whiteListCandidates })
    }
    if (nextProps.config.speedKitConfig) {
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
      <div className="pa1">
        <div className="pt1">
          <div className="flex items-center">
            <span className="flex-auto w-100 text-right">Desktop</span>
            <Toggle
              className="mh1"
              defaultChecked={this.props.config.mobile}
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
          <div className="flex-grow-1 flex-shrink-0" style={{ flexBasis: '100%' }}>
            <div className="ph2">
              <h5 className="mv1 text-center">WebPagetest Config</h5>
              <div className="pt1 flex items-center">
                <span className="flex-auto w-100">Mobile</span>
                <Toggle
                  className="ml1"
                  defaultChecked={this.props.config.mobile}
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
          <div className="flex-grow-1 flex-shrink-0" style={{ maxWidth: '100%' }}>
            <div className="ph2">
              <h5 className="mv1 text-center">Speed Kit Config</h5>
              <div className="pt1">
                <CodeMirror
                  value={this.state.speedKitConfig}
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
          </div>
        </div>
      </div>
    )
  }

  render() {
    // const url = splitUrl(this.props.config.url)
    // debugger

    return (
      <div className="config__form flex-grow-1 flex flex-column">
        <form className="flex flex-grow-1 flex-column" onSubmit={this.handleSubmit} noValidate>
          <div className="config__form-input-wrapper">
            <input
              className="w-100 ph2 pv2 config__form-input"
              type="url"
              inputMode="url"
              spellCheck="false"
              value={this.props.config.url}
              onChange={this.handleUrlChange}
              placeholder="Enter URL here..."
              noValidate
            />
            {/*<div className="parsed-domain ph2 pv2">
              {Array.isArray(url) && url.length === 3 ? [
                <span key="pre" className="faded">{url[0]}</span>,
                <span key="hostname">{url[1]}</span>,
                <span key="rest" className="faded">{url[2]}</span>
              ] : (
                <span>{url}</span>
              )}
            </div>*/}
            <div className="config__form-submit-wrapper">
              <button className="config__form-submit flex justify-center items-center" type="submit">
                {this.props.isInitiated ? (
                  <div className="spinner__wrapper" style={{ width: 25, height: 25 }}>
                    <Spinner />
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
                    <a onClick={this.toggleAdvancedConfig}>Hide Advanced Settings</a>
                  </span>
                ): (
                  <span>
                    <a onClick={this.toggleAdvancedConfig}>Show Advanced Settings</a>
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
