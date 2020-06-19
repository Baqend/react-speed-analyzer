import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ConfigForm from 'components/ConfigForm/ConfigForm'

import DeviceContainer from 'components/DeviceContainer/DeviceContainer'

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

  renderForm() {
    return (
      <div className="flex-grow-1 flex flex-column justify-center">
        <div className="text-center flex-grow-1 flex flex-column justify-end">
          <h1 className="header">Test Your Speed</h1>
        </div>
        <div className="mt4 flex-grow-1 flex flex-column">
          <ConfigForm
            config={this.props.config}
            showConfig={true}
            showConfigToggle={false}
            showAdvancedConfig={this.state.showAdvancedConfig}
            onToggleAdvancedConfig={this.onToggleAdvancedConfig}
            onSubmit={this.props.onSubmit}
          />
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="flex-column flex-grow-1 flex items-center background-embedded">
        <DeviceContainer
          embedded={true}
          mobile={false}
          content={
            <div className={`flex-grow-1 flex justify-center`}>
              <div className="flex-grow-1">
                {this.renderForm()}
              </div>
            </div>
          }
        />
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
