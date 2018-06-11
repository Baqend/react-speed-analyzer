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

  renderForm() {
    return (
      <div className="flex-grow-1 flex flex-column justify-center">
        <div className="text-center flex-grow-1 flex flex-column justify-end">
          <h1 className="mv2">Page Speed Analyzer</h1>
        </div>
        <div className="mt4 flex-grow-1 flex flex-column">
          <ConfigForm
            config={this.props.config}
            showConfig={true}
            showConfigToggle={false}
            showAdvancedConfig={this.state.showAdvancedConfig}
            onToggleAdvancedConfig={this.props.onToggleAdvancedConfig}
            onSubmit={this.props.onSubmit}
          />
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="loading-screen flex-column flex-grow-1 flex items-center">
        <DeviceContainer
          showDevice={!this.state.showAdvancedConfig}
          mobile={this.props.config.mobile}
          backgroundImage={this.props.result.testOverview.psiScreenshot}
          left={
            <div className="left">
              {this.renderForm()}
            </div>
          }
          right={null}
        />
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  onToggleAdvancedConfig: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
