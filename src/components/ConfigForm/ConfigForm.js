import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ConfigFormComponent from './ConfigFormComponent'

import { handleUrlInput, handleLocationChange, handleMobileSwitch, handleCachingSwitch } from '../../actions/config'

class ConfigForm extends Component {
  onUrlChange = (data) => {
    this.props.actions.handleUrlInput(data)
  }

  onLocationChange = (data) => {
    this.props.actions.handleLocationChange(data)
  }

  onMobileSwitch = () => {
    this.props.actions.handleMobileSwitch(this.props.config.isMobile)
  }

  onCachingSwitch = () => {
    this.props.actions.handleCachingSwitch(this.props.config.caching)
  }

  render() {
    return (
      <ConfigFormComponent
        config={this.props.config}
        showConfig={this.props.showConfig}
        showAdvancedConfig={this.props.showAdvancedConfig}
        isInitiated={this.props.isInitiated}
        onSubmit={this.props.onSubmit}
        onUrlChange={this.onUrlChange}
        onLocationChange={this.onLocationChange}
        onMobileSwitch={this.onMobileSwitch}
        onCachingSwitch={this.onCachingSwitch}
      />
    )
  }
}

ConfigForm.defaultProps = {
  showConfig: true,
  showAdvancedConfig: false,
}

ConfigForm.propTypes = {
  config: PropTypes.object.isRequired,
  showConfig: PropTypes.bool,
  showAdvancedConfig: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    isInitiated: state.result.isInitiated,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      handleUrlInput,
      handleLocationChange,
      handleMobileSwitch,
      handleCachingSwitch,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfigForm)
