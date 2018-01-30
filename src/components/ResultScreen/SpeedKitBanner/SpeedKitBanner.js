import React, { Component } from 'react'

import './SpeedKitBanner.css'

class SpeedKitBanner extends Component {
  render() {
    return (
      <div className="banner">
        <div className="container ph2 pv6">
          <div className="flex flex-wrap flex-nowrap-ns items-center" style={{ margin: -8 }}>
            <div className="w-100 w-50-ns tc tl-ns ph1 pv2">
              <h2 className="mv1">Try Baqend Speed Kit Today</h2>
              <span className="faded">Make your websites load instantly</span>
            </div>
            <div className="w-100 w-50-ns pv2 tc tr-ns">
              <a
                href="https://www.baqend.com/speedkit.html?_ga=2.235057797.527125052.1516095583-312811701.1516095583"
                className="btn btn-white ma1">
                 Learn More
              </a>
              <a
                href="https://dashboard.baqend.com/register?appType=speedkit&_ga=2.230289688.527125052.1516095583-312811701.1516095583"
                className="btn btn-orange ma1">
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
