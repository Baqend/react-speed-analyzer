import React, { Component } from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import StartingScreenComponent from './StartingScreenComponent'

import { handleUrlInput, handleLocationChange, handleMobileSwitch } from '../../actions/config'

class StartingScreen extends Component {
  onUrlChange = (data) => {
    this.props.actions.handleUrlInput(data)
  }

  onLocationChange = (data) => {
    this.props.actions.handleLocationChange(data)
  }

  onMobileSwitch = () => {
    this.props.actions.handleMobileSwitch(this.props.mobile)
  }

  render() {
    return (
      <StartingScreenComponent
        url={this.props.url}
        location={this.props.location}
        onUrlChange={this.onUrlChange}
        onLocationChange={this.onLocationChange}
        onMobileSwitch={this.onMobileSwitch}
      />
    )
  }
}

function mapStateToProps(state) {
  return {
    url: state.config.url,
    location: state.config.location,
    mobile: state.config.mobile
  }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators({ handleUrlInput, handleLocationChange, handleMobileSwitch}, dispatch) }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
