import React, { Component } from 'react'
import './ResultVideos.css'
import { isDeviceIOS } from '../../../helper/utils'
import { calculateFactor } from '../../../helper/resultHelper'

class ResultVideosComponent extends Component {
  playVideos = (videoLabel) => {
    this[videoLabel].currentTime = 0
    const playPromise = this[videoLabel].play()

    if (!isDeviceIOS()) {
      playPromise.then(() => {
        /** @type {String} */
        const secondVideo = videoLabel === 'speedKitVideo' ? 'competitorVideo' : 'speedKitVideo'
        if(this[secondVideo]) {
          this[secondVideo].currentTime = 0
          this[secondVideo].play()
        }
      }).catch(error => {})
    }
  }

  render() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    const competitorVideoPath = this.props.competitorTest.videoFileFirstView
    const speedKitVideoPath = this.props.speedKitTest.videoFileFirstView

    return (
      <div>
        <div className="flex items-center relative">
          <div className="mainFactor text-center">
            {calculateFactor(competitorData[this.props.mainMetric], speedKitData[this.props.mainMetric])}x <br/>Faster
          </div>
          <div className="w-50 text-center pt2">
            <span>Your Website</span>
            <br/>
            {competitorData[this.props.mainMetric]}ms
          </div>
          <div className="w-50 text-center pt2">
            {!this.props.speedKitError ?
              <div>
                <span>With Speedkit</span>
                <br/>
                <span> { speedKitData[this.props.mainMetric] }ms </span>
              </div> : <div>Contact us</div>
            }
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-50 text-center pt5 pr6 pb5 pl6">
            <video id="competitorVideo" playsInline autoPlay controls className="embedVideo"
              ref={(video) => {this.competitorVideo = video}} onClick={() => this.playVideos('competitorVideo')}
              onPlay={() => this.playVideos('competitorVideo')}
              src={competitorVideoPath && 'https://makefast.app.baqend.com/v1' + competitorVideoPath}
            />
          </div>
          <div className="w-50 text-center speedKitVideo pt5 pr6 pb5 pl6">
            {!this.props.speedKitError ?
              <video id="speedKitVideo" playsInline autoPlay controls className="embedVideo"
                ref={(video) => {this.speedKitVideo = video}} onClick={() => this.playVideos('speedKitVideo')}
                onPlay={() => this.playVideos('speedKitVideo')}
                src={speedKitVideoPath && 'https://makefast.app.baqend.com/v1' + speedKitVideoPath}
              /> : <span>Hier könnte ein geiles Kontaktformular stehen!!</span>
            }
          </div>
        </div>
      </div>
    )
  }
}

export default ResultVideosComponent
