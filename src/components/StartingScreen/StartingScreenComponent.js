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

  render() {
    return (
      <form>
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
            <input
              type="radio"
              name="location"
              value="US"
              onChange={this.handleLocationChange}
              checked={this.props.location === 'us-east-1:Chrome.Native'}
            />
            USA
          </label>
          <label>
            <input
              type="radio"
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
            <input
              type="radio"
              name="mobile"
              value={false}
              onChange={this.handleMobileSwitch}
              checked={!this.props.mobile}
            />
            No
          </label>
          <label>
            <input
              type="radio"
              name="mobile"
              value
              onChange={this.handleMobileSwitch}
              checked={this.props.mobile}
            />
            Yes
          </label>
        </div>
      </form>
    )
  }
}

StartingScreenComponent.propTypes = {
  url: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  onUrlChange: PropTypes.func.isRequired,
  onLocationChange: PropTypes.func.isRequired,
  onMobileSwitch: PropTypes.func.isRequired,
}

export default StartingScreenComponent
