import React, { Component } from 'react'

import './SpeedKitAnalyzer.css'
import speedKitVideo from '../../../assets/speedkitvideo.png'

class SpeedKitBanner extends Component {
  render() {
    return (
      <div className="pt4-ns">
        <div className="pv2 mt2 pv4-ns flex items-center">
          <div className="w-100 w-60-ns">
            <h1 className="mt0">Speed Kit Explained.</h1>
            <p className="faded">
              Watch this short video, to learn how Speed Kit can help you make fast page loads your competitive advantage.
            </p>
            <a href="">Learn more</a>
          </div>
          <div className="w-40-ns">
            <img src={speedKitVideo} width="100%" style={{ borderRadius: 2 }}/>
          </div>
        </div>
      </div>
    )
  }
}

export default SpeedKitBanner
