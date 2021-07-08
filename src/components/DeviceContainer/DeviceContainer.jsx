import React, { Component } from 'react'
import './DeviceContainer.css'

export default class DeviceContainer extends Component {
  render() {
    const { mobile, content, bgImage, embedded } = this.props
    const showBgImage = bgImage && !mobile
    return (
      <div className="device">
        <div className={`${mobile ? 'device__phone' : 'device__laptop'}`}>
          { !embedded && <div className="device__wrapper-top"/> }
          <div className={`device__wrapper-outer${embedded ? 'embedded' : ''}`}>
            <div className={`device__wrapper${embedded ? 'embedded' : ''}`}>
              <div className="device__screen">{content}</div>
              {showBgImage && (
                <div
                  className="device__background"
                  style={{ backgroundImage: `url(${bgImage})` }}>
                </div>
              )}
            </div>
          </div>
          { !embedded && (
            <div className="device__wrapper-bottom">
              <div className="device-notch"/>
            </div>
          )}
        </div>
      </div>
    )
  }
}
