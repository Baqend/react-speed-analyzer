import React, { Component } from 'react'
import './Result.css'
import { isDeviceIOS } from '../../../helper/utils'

class ResultVideos extends Component {

  playVideos = (videoLabel) => {
    this[videoLabel].currentTime = 0
    const playPromise = this[videoLabel].play()
    if (!isDeviceIOS()) {
      playPromise.then(() => {
        const secondVideo = videoLabel === 'speedKitVideo' ? 'competitorVideo' : 'speedKitVideo'
        if(this[secondVideo]) {
          this[secondVideo].currentTime = 0
          this[secondVideo].play()
        }
      }).catch(error => {})
    }
  }

  render() {
    const competitorVideoPath = this.props.competitorTest.videoFileFirstView
    const speedKitVideoPath = this.props.speedKitTest.videoFileFirstView

    return (
      <div className="flex">
        <div className="w-50 flex-auto pv4 ph6">
          <video id="competitorVideo"
            playsInline
            autoPlay
            controls
            className="embedVideo"
            ref={(video) => {this.competitorVideo = video}}
            onClick={() => this.playVideos('competitorVideo')}
            onPlay={() => this.playVideos('competitorVideo')}
            src={competitorVideoPath && 'https://makefast.app.baqend.com/v1' + competitorVideoPath} />
        </div>
        {!this.props.speedKitError && (
          <div className="w-50 flex-auto speedKitVideo pv4 ph6">
            <video id="speedKitVideo"
              playsInline
              autoPlay
              controls
              className="embedVideo"
              ref={(video) => {this.speedKitVideo = video}}
              onClick={() => this.playVideos('speedKitVideo')}
              onPlay={() => this.playVideos('speedKitVideo')}
              src={speedKitVideoPath && 'https://makefast.app.baqend.com/v1' + speedKitVideoPath} />
          </div>
        )}
      </div>
    )
  }
}

export default ResultVideos
