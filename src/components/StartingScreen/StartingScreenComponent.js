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
        <div className="loading">
          <div className="loading__spinner animated slideInUp">
            <div className="spinner__wrapper">
              <svg className="spinner" width="100%" height="100%" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                <circle className="path" fill="none" strokeWidth="2" strokeLinecap="round" cx="33" cy="33" r="30"></circle>
              </svg>
            </div>
          </div>
          <div className="loading__status">
            <div className="text">
              <h2 className="text__headline">We are running a series of tests against your site</h2>
              <div className="text__details">
                See how fast your current backend stack delivers your site to users. We will compare the results to a version of your site using Baqend Speed Kit
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
