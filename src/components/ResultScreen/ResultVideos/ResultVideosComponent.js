import React, { Component } from 'react'

import './ResultVideos.css'
import { isDeviceIOS } from '../../../helper/utils'

class ResultVideosComponent extends Component {
  playVideos = (videoLabel) => {
    this[videoLabel].currentTime = 0
    const playPromise = this[videoLabel].play()

    if (!isDeviceIOS()) {
      /** @type {String} */
      const secondVideo = videoLabel === 'speedKitVideo' ? 'competitorVideo' : 'speedKitVideo'
      this[secondVideo].currentTime = 0
      playPromise.then(() => {
        this[secondVideo].play()
      }).catch(error => {})
    }
  }

  render() {
    const competitorVideoPath = this.props.competitorTest.videoFileFirstView
    const speedKitVideoPath = this.props.speedKitTest.videoFileFirstView

    return (
      <div>
        <div className="flex items-center pb1">
          <div className="w-50 text-center">
            <span>Your Website</span>
            <br/>
            {this.props.competitorTest.firstView.speedIndex}ms
          </div>
          <div className="w-50 text-center">
            <span>With Speedkit</span>
            <br/>
            <span>{this.props.speedKitTest.firstView.speedIndex}ms</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-50 pr6 pl6">
            <video id="competitorVideo" playsInline autoPlay controls className="embedVideo"
              ref={(video) => {this.competitorVideo = video}} onClick={() => this.playVideos('competitorVideo')}
              onPlay={() => this.playVideos('competitorVideo')}
              src={competitorVideoPath && 'https://makefast.app.baqend.com/v1' + competitorVideoPath}
            />
          </div>
          <div className="w-50 pr6 pl6">
            <video id="speedKitVideo" playsInline autoPlay controls className="embedVideo"
              ref={(video) => {this.speedKitVideo = video}} onClick={() => this.playVideos('speedKitVideo')}
              onPlay={() => this.playVideos('speedKitVideo')}
              src={speedKitVideoPath && 'https://makefast.app.baqend.com/v1' + speedKitVideoPath}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default ResultVideosComponent
