import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './LoadingScreenComponent.css'

import DeviceContainer from 'components/DeviceContainer/DeviceContainer'
import CircularProgress from '../../components/CircularProgress/CircularProgress'
import CustomerSlider from '../../components/CustomerSlider/CustomerSlider'

class StartingScreenComponent extends Component {
  render() {
    return (
      <div className="loading-screen flex-column flex-grow-1 flex items-center background-embedded">
        <DeviceContainer
          embedded={true}
          mobile={false}
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

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
}

export default StartingScreenComponent
