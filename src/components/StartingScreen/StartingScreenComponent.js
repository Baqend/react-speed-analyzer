import React, { Component } from 'react'
import PropTypes from 'prop-types'

class StartingScreenComponent extends Component {
  handleUrlChange = (changeEvent) => {
    this.props.onUrlChange(changeEvent.target.value)
  }

  handleLocationChange = (changeEvent) => {
    this.props.onLocationChange(changeEvent.target.value)
  }

  handleMobileSwitch = () => {
    this.props.onMobileSwitch()
  }

  handleCachingSwitch = () => {
    this.props.onCachingSwitch()
  }

  handleSubmit = (event) => {
    event.preventDefault()
    this.props.onSubmit();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div>
          <input type="text"
                 inputMode="url"
                 spellCheck="false"
                 value={this.props.url}
                 onChange={this.handleUrlChange}
                 placeholder="Enter URL here..."
          />
        </div>
        <div>
          Location:
          <label>
            <input type="radio"
                   name="location"
                   value="US"
                   onChange={this.handleLocationChange}
                   checked={this.props.location === 'us-east-1:Chrome.Native'}
            />
            USA
          </label>
          <label>
            <input type="radio"
                   name="location"
                   value="EU"
                   onChange={this.handleLocationChange}
                   checked={this.props.location === 'eu-central-1:Chrome.Native'}
            />
            EU
          </label>
        </div>
        <div>
          Mobile:
          <label>
            <input type="radio"
                   name="mobile"
                   value={false}
                   onChange={this.handleMobileSwitch}
                   checked={!this.props.mobile}
            />
            No
          </label>
          <label>
            <input type="radio"
                   name="mobile"
                   value={true}
                   onChange={this.handleMobileSwitch}
                   checked={this.props.mobile}
            />
            Yes
          </label>
        </div>
        <div>
          Caching:
          <label>
            <input type="radio"
                   name="caching"
                   value={false}
                   onChange={this.handleCachingSwitch}
                   checked={!this.props.caching}
            />
            No
          </label>
          <label>
            <input type="radio"
                   name="caching"
                   value={true}
                   onChange={this.handleCachingSwitch}
                   checked={this.props.caching}
            />
            Yes
          </label>
        </div>
        <div>
          <button type="submit">Go</button>
        </div>
      </form>
    )
  }
}

StartingScreenComponent.propTypes = {
  url: PropTypes.string,
  location: PropTypes.string,
  mobile: PropTypes.bool,
  onUrlChange: PropTypes.func,
  onLocationChange: PropTypes.func,
  onMobileSwitch: PropTypes.func,
  onCachingSwitch: PropTypes.func,
  onSubmit: PropTypes.func
}

export default StartingScreenComponent
