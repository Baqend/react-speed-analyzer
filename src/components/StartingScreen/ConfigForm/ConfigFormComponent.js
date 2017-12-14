import React, { Component } from 'react'
import PropTypes from 'prop-types'

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
      <div className="pa2">
        <form onSubmit={this.handleSubmit}>
          <div>
            <input type="text"
              inputMode="url"
              spellCheck="false"
              value={this.props.config.url}
              onChange={this.handleUrlChange}
              placeholder="Enter URL here..."
            />
          </div>
          <div>
            Location:
            <label>
              <input
                type="radio"
                name="location"
                value="US"
                onChange={this.handleLocationChange}
                checked={this.props.config.location === 'us-east-1:Chrome.Native'}
              />
              USA
            </label>
            <label>
              <input
                type="radio"
                name="location"
                value="EU"
                onChange={this.handleLocationChange}
                checked={this.props.config.location === 'eu-central-1:Chrome.Native'}
              />
              EU
            </label>
          </div>
          <div>
            Mobile:
            <label>
              <input
                type="radio"
                name="mobile"
                value={false}
                onChange={this.handleMobileSwitch}
                checked={!this.props.config.isMobile}
              />
              No
            </label>
            <label>
              <input
                type="radio"
                name="mobile"
                value
                onChange={this.handleMobileSwitch}
                checked={this.props.config.isMobile}
              />
              Yes
            </label>
          </div>
          <div>
            Caching:
            <label>
              <input
                type="radio"
                name="caching"
                value={false}
                onChange={this.handleCachingSwitch}
                checked={!this.props.config.caching}
              />
              No
            </label>
            <label>
              <input
                type="radio"
                name="caching"
                value={true}
                onChange={this.handleCachingSwitch}
                checked={this.props.config.caching}
              />
              Yes
            </label>
          </div>
          <div>
            <button type="submit">Go</button>
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
