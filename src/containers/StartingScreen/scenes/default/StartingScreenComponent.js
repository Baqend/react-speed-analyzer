import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ConfigForm from 'components/ConfigForm/ConfigForm'

import DeviceContainer from 'components/DeviceContainer/DeviceContainer'
import Header from '../../../../components/Header/Header'

class StartingScreenComponent extends Component {
  renderForm() {
    return (
      <div className="flex-grow-1 flex flex-column justify-center">
        <div className="text-center flex-grow-1 flex flex-column justify-end">
          <h1 className="header">Test Your Speed</h1>
        </div>
        <div className="mt5 flex-grow-1 flex flex-column">
          <ConfigForm
            config={this.props.config}
            showConfig={true}
            showConfigToggle={false}
            onToggleAdvancedConfig={this.props.onToggleAdvancedConfig}
            onSubmit={this.props.onSubmit}
          />
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="flex-column flex-grow-1 flex items-center">
        <Header changeColorOnResize={true} />
        <DeviceContainer
          embedded={false}
          mobile={this.props.config.mobile}
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
  onToggleAdvancedConfig: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
