import React, { Component } from 'react'
import './DeviceContainer.css'

export default class DeviceContainer extends Component {
  render() {
    const { mobile, content } = this.props
    return (
      <div className="device">
        <div className={`${mobile ? 'device__phone' : 'device__laptop'}`}>
          <div className="device__wrapper-top"></div>
          <div className="device__wrapper-outer">
            <div className="device__wrapper">
              <div className="device__screen">
                {content}
              </div>
            </div>
          </div>
          <div className="device__wrapper-bottom">
            <div className="device-notch"></div>
          </div>
        </div>
      </div>
    )
  }
}
