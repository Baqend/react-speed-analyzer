import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ConfigFormComponent from './ConfigFormComponent'

import {
  handleUrlInput,
  handleCookieInput,
  handleLocationChange,
  handleTimeoutChange,
  handleSpeedKitConfigChange,
  handleMobileSwitch,
  handleCachingSwitch
} from '../../actions/config'

class ConfigForm extends Component {
  onUrlChange = (data) => {
    this.props.actions.handleUrlInput(data)
  }

  onCookieChange = (data) => {
    this.props.actions.handleCookieInput(data)
  }

  onLocationChange = (data) => {
    this.props.actions.handleLocationChange(data)
  }

  onTimeoutChange = (data) => {
    this.props.actions.handleTimeoutChange(data)
  }

  onSpeedKitConfigChange = (data) => {
    this.props.actions.handleSpeedKitConfigChange(data)
  }

  onMobileSwitch = () => {
    this.props.actions.handleMobileSwitch(this.props.config.mobile)
  }

  onCachingSwitch = () => {
    this.props.actions.handleCachingSwitch(this.props.config.caching)
  }

  render() {
    return (
      <ConfigFormComponent
        config={this.props.config}
        whiteListCandidates={this.props.whiteListCandidates}
        showConfig={this.props.showConfig}
        showConfigToggle={this.props.showConfigToggle}
        showAdvancedConfig={this.props.showAdvancedConfig}
        isInitiated={this.props.isInitiated}
        onSubmit={this.props.onSubmit}
        onUrlChange={this.onUrlChange}
        onCookieChange={this.onCookieChange}
        onLocationChange={this.onLocationChange}
        onTimeoutChange={this.onTimeoutChange}
        onSpeedKitConfigChange={this.onSpeedKitConfigChange}
        onMobileSwitch={this.onMobileSwitch}
        onCachingSwitch={this.onCachingSwitch}
        onToggleAdvancedConfig={this.props.onToggleAdvancedConfig}
      />
    )
  }
}

ConfigForm.defaultProps = {
  showConfig: true,
  showConfigToggle: true,
  showAdvancedConfig: false,
}

ConfigForm.propTypes = {
  showConfig: PropTypes.bool,
  showConfigToggle: PropTypes.bool,
  showAdvancedConfig: PropTypes.bool,
  onToggleAdvancedConfig: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  whiteListCandidates: PropTypes.array,
}

function mapStateToProps(state) {
  return {
    isInitiated: state.result.isInitiated,
    whiteListCandidates: state.result.whiteListCandidates
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      handleUrlInput,
      handleCookieInput,
      handleLocationChange,
      handleTimeoutChange,
      handleSpeedKitConfigChange,
      handleMobileSwitch,
      handleCachingSwitch,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfigForm)
