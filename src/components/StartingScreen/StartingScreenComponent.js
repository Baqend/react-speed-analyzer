import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ConfigForm from './ConfigForm/ConfigForm'

class StartingScreenComponent extends Component {
  render() {
    return (
      <div className="device device__laptop">
        <div className="text-center">
          <h1>Page Speed Analyzer</h1>
          <span>Test the performance of your site!</span>
        </div>
        <ConfigForm config={this.props.config} onSubmit={this.props.onSubmit} />
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
