import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import StartingScreenComponent from './StartingScreenComponent'

import { handleUrlInput } from '../../actions/config'

class StartingScreen extends Component {
  onUrlChange = (data) => {
    this.props.actions.handleUrlInput(data)
  }

  render() {
    return (
      <StartingScreenComponent onUrlChange={this.onUrlChange} />
    )
  }
}

StartingScreen.propTypes = {
  url: PropTypes.string,
  actions: PropTypes.object.isRequired,
  handleUrlInput: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  return { url: state.config.url }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators({ handleUrlInput }, dispatch) }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
