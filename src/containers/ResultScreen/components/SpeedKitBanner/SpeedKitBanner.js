import React, { Component } from 'react'

import './SpeedKitBanner.css'

class SpeedKitBanner extends Component {
  render() {
    return (
      <div className="banner">
        <div className="container ph2 pv4 pv7-ns">
          <div className="flex flex-wrap flex-nowrap-ns items-center ph0" style={{ margin: -8 }}>
            <div className="w-100 w-50-ns tc tr-ns ph2 pv2">
              <h2 className="mv1">Try Speed Kit Today</h2>
              <span className="faded">Make your websites load instantly</span>
            </div>
            <div className="w-100 w-50-ns ph2 pv2 tc tl-ns">
              <a
                href="https://www.baqend.com/speedkit.html"
                target="_blank" rel="noopener noreferrer"
                className="btn btn-white ma1">
                 Learn More
              </a>
              <a
                href="https://dashboard.baqend.com/register?appType=speedkit"
                target="_blank" rel="noopener noreferrer"
                className="btn btn-purple ma1">
                Get Started for Free
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SpeedKitBanner
