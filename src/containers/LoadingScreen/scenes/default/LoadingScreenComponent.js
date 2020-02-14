import React, { Component } from 'react'
import PropTypes from 'prop-types'

import DeviceContainer from 'components/DeviceContainer/DeviceContainer'

import CustomerSlider from '../../components/CustomerSlider/CustomerSlider'
import CircularProgress from '../../components/CircularProgress/CircularProgress'

class LoadingScreenComponent extends Component {
  render() {
    return (
      <div className="loading-screen flex-column flex-grow-1 flex items-center">
        <div className="logo"></div>
        <DeviceContainer
          mobile={this.props.config.mobile}
          bgImage={this.props.result.testOverview.psiScreenshot}
          content={
            <div className="flex flex-column items-center">
              <div className="progress__wrapper">
                <CircularProgress progress={this.props.result.testProgress} />
              </div>
              <div className="carousel__wrapper">
                <CustomerSlider/>
              </div>
            </div>
          }
        />
      </div>
    )
  }
}

LoadingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
}

export default LoadingScreenComponent
