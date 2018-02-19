import React, { Component } from 'react'
import './DeviceContainer.css'

const DeviceNodes = ({ children, img }) => (
  <div className="device__wrapper-outer">
    <div className="device__wrapper">
      {img && (
        <div
          className="device__background-image animated fadeIn"
          style={{ backgroundImage: `linear-gradient(rgba(17, 33, 47, 0.85), rgba(17, 33, 47, 1) 75%), url(${img})` }}>
        </div>
      )}
      <div className="device__screen">
        {children}
      </div>
    </div>
  </div>
)

export default class DeviceContainer extends Component {
  render() {
    const { showDevice, isMobile, left, right, showRight, backgroundImage } = this.props
    return (
      <div className={`${showDevice ? 'device' : 'no-device'}`}>
        <div className={`${isMobile ? 'device__phone' : 'device__laptop'}`}>
          <DeviceNodes img={backgroundImage && isMobile ? null : backgroundImage }>
            <div className="flex-grow-1 flex flex-column" style={{ overflow: 'hidden' }}>
              <div className={`flex-grow-1 flex justify-center items-center ${showRight && 'loading'}`}>
                <div className="device-left">
                  <DeviceNodes img={backgroundImage && isMobile ? backgroundImage : null }>
                    {left}
                  </DeviceNodes>
                </div>
                {showRight &&
                  <div className="device-right">
                    <div className="carousel flex flex-grow-1 flex-column justify-center items-stretch pa2" style={{ flexBasis: '100%' }}>
                      {right}
                    </div>
                  </div>
                }
              </div>
            </div>
          </DeviceNodes>
        </div>
      </div>
    )
  }
}
