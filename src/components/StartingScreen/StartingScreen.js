import React, { Component } from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import StartingScreenComponent from './StartingScreenComponent'

import { handleUrlInput, handleLocationChange, handleMobileSwitch, handleCachingSwitch } from '../../actions/config'
import { normalizeUrl } from '../../actions/normalizeUrl'

class StartingScreen extends Component {
  constructor(props) {
    super(props)
  }

  onUrlChange = (data) => {
    this.props.actions.handleUrlInput(data)
  }

  onLocationChange = (data) => {
    this.props.actions.handleLocationChange(data)
  }

  onMobileSwitch = () => {
    this.props.actions.handleMobileSwitch(this.props.mobile)
  }

  onCachingSwitch = () => {
    this.props.actions.handleCachingSwitch(this.props.caching)
  }

  onSubmit = async () => {
    if(this.props.url.length > 0) {
      await this.props.actions.normalizeUrl(this.props.url)
    }
  }

  render() {
    return (
      <StartingScreenComponent
        url={this.props.url}
        location={this.props.location}
        mobile={this.props.mobile}
        caching={this.props.caching}
        onUrlChange={this.onUrlChange}
        onLocationChange={this.onLocationChange}
        onMobileSwitch={this.onMobileSwitch}
        onCachingSwitch={this.onCachingSwitch}
        onSubmit={this.onSubmit}
      />
    )
  }
}

function mapStateToProps(state) {
  return {
    url: state.config.url,
    location: state.config.location,
    mobile: state.config.mobile,
    caching: state.config.caching
  }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(
    {
      handleUrlInput,
      handleLocationChange,
      handleMobileSwitch,
      handleCachingSwitch,
      normalizeUrl
    }, dispatch) }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
