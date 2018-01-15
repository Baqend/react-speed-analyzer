import React, { Component } from 'react'
import './ResultVideos.css'
import { isDeviceIOS } from '../../../helper/utils'
import { calculateFactor } from '../../../helper/resultHelper'
import PropTypes from 'prop-types'
import ResultScreenComponent from '../ResultScreenComponent'

class ResultVideosComponent extends Component {
  handleSubmit = (event) => {
    event.preventDefault()
    this.props.onSubmit()
  }

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
          {!this.props.speedKitError ?
            <div className="mainFactor text-center">
              {calculateFactor(competitorData[this.props.mainMetric], speedKitData[this.props.mainMetric])}x<br/> Faster
            </div> : ''
          }
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
        <div className="flex">
          <div className="w-50 pt5 pr6 pb5 pl6">
            <video id="competitorVideo" playsInline autoPlay controls className="embedVideo"
              ref={(video) => {this.competitorVideo = video}} onClick={() => this.playVideos('competitorVideo')}
              onPlay={() => this.playVideos('competitorVideo')}
              src={competitorVideoPath && 'https://makefast.app.baqend.com/v1' + competitorVideoPath}
            />
          </div>
          <div className="w-50 speedKitVideo pt5 pr6 pb5 pl6">
            {!this.props.speedKitError ?
              <video id="speedKitVideo" playsInline autoPlay controls className="embedVideo"
                ref={(video) => {this.speedKitVideo = video}} onClick={() => this.playVideos('speedKitVideo')}
                onPlay={() => this.playVideos('speedKitVideo')}
                src={speedKitVideoPath && 'https://makefast.app.baqend.com/v1' + speedKitVideoPath}
              /> :
              <form className="w-80" onSubmit={this.handleSubmit}>
                <div className="mb1">
                  <label htmlFor="name">Name</label>
                  <input id="name" className="pa1 w-100" type="text" required/>
                </div>
                <div className="mb1">
                  <label htmlFor="mail">Email</label>
                  <input id="mail" className="pa1 w-100" type="text" required/>
                </div>
                <div className="mb1">
                  <label htmlFor="message">Tell us a bit about your needs. (optional)</label>
                  <textarea id="message" className="pa1 w-100"/>
                </div>
                <div className="text-right">
                  <button type="submit">Contact Baqend</button>
                </div>
              </form>
            }
          </div>
        </div>
      </div>
    )
  }
}

ResultVideosComponent.propTypes = {
  onSubmit: PropTypes.func.isRequired,
}

export default ResultVideosComponent
