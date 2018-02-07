import React, { Component } from 'react'
import './Result.css'
import { isDeviceIOS, isIE, isEdge } from '../../../helper/utils'

class ResultVideos extends Component {
  constructor(props) {
    super(props)
    this.state = {
      progressCompetitor: 0,
      progressSpeedKit: 0,
    }
  }

  playVideos = (videoLabel) => {
    this[videoLabel].currentTime = 0
    const playPromise = this[videoLabel].play()
    const secondVideo = videoLabel === 'speedKitVideo' ? 'competitorVideo' : 'speedKitVideo'
    if(isIE() || isEdge()) {
      if(this[secondVideo]) {
        this[secondVideo].currentTime = 0
        this[secondVideo].play()
      }
    } else if (!isDeviceIOS()) {
      playPromise.then(() => {
        if(this[secondVideo]) {
          this[secondVideo].currentTime = 0
          this[secondVideo].play()
        }
      }).catch(error => {})
    }
  }

  handleCompetitorProgress = () => {
    const percent = (this.competitorVideo.currentTime / this.competitorVideo.duration) * 100
    this.setState({
      progressCompetitor: percent
    })
  }

  handleSpeedKitProgress = () => {
    const percent = (this.speedKitVideo.currentTime / this.speedKitVideo.duration) * 100
    this.setState({
      progressSpeedKit: percent
    })
  }

  componentDidMount() {
    // setTimeout(() => {
    //   this.playVideos('competitorVideo')
    // }, 500)

    // this.state.video.addEventListener('timeupdate', this.handleProgress)

    this.competitorVideo && this.competitorVideo.addEventListener('timeupdate', this.handleCompetitorProgress)
    this.speedKitVideo && this.speedKitVideo.addEventListener('timeupdate', this.handleSpeedKitProgress)
  }

  componentWillUnmount() {
    this.competitorVideo && this.competitorVideo.removeEventListener('timeupdate', this.handleCompetitorProgress)
    this.speedKitVideo && this.speedKitVideo.removeEventListener('timeupdate', this.handleSpeedKitProgress)
  }

  render() {
    const { speedKitError } = this.props.result
    const competitorVideoPath = this.props.competitorTest.videoFileFirstView
    const speedKitVideoPath = this.props.speedKitTest.videoFileFirstView
    // const data = this.props.testOverview.psiScreenshot
    // <img src={`data:${data.mime_type};base64,${data.data.replace(/_/g, '/').replace(/-/g, '+')}`} />
    // poster={`data:${data.mime_type};base64,${data.data.replace(/_/g, '/').replace(/-/g, '+')}`}
    return (
      <div className="flex justify-center">
        <div className="w-50 pa2 pv4-ns ph6-ns">
          <div className="video__wrapper">
            <div className="video__wrapper-inner">
              <div className="relative" style={{ width: '100%', height: '100%'}}>
                <video id="competitorVideo"
                  playsInline
                  controls={false}
                  autoPlay
                  className="embedVideo"
                  ref={(video) => {this.competitorVideo = video}}
                  onClick={() => this.playVideos('competitorVideo')}
                  onPlay={() => this.playVideos('competitorVideo')}
                  src={competitorVideoPath && 'https://makefast.app.baqend.com/v1' + competitorVideoPath} />
                {/*<div style={{ backgroundImage: `url(data:${data.mime_type};base64,${data.data.replace(/_/g, '/').replace(/-/g, '+')})`}}></div>*/}

                {this.competitorVideo && this.competitorVideo.paused && (
                  <div className="video__wrapper-play" onClick={() => this.playVideos('competitorVideo')}>►</div>
                )}
                <div className="video__wrapper-progress">
                  <div className="video__wrapper-progress-bar" style={{ flexBasis: `${this.state.progressCompetitor}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {!speedKitError && (
          <div className="w-50 speedKitVideo pa2 pv4-ns ph6-ns">
            <div className="video__wrapper">
              <div className="video__wrapper-inner">
                <div className="relative" style={{ width: '100%', height: '100%'}}>
                  <video id="speedKitVideo"
                    playsInline
                    controls={false}
                    autoPlay
                    className="embedVideo"
                    ref={(video) => {this.speedKitVideo = video}}
                    onClick={() => this.playVideos('speedKitVideo')}
                    onPlay={() => this.playVideos('speedKitVideo')}
                    src={speedKitVideoPath && 'https://makefast.app.baqend.com/v1' + speedKitVideoPath} />
                  {/*<div style={{ backgroundImage: `url(data:${data.mime_type};base64,${data.data.replace(/_/g, '/').replace(/-/g, '+')})`}}></div>*/}
                  {this.speedKitVideo && this.speedKitVideo.paused && (
                    <div className="video__wrapper-play" onClick={() => this.playVideos('speedKitVideo')}>►</div>
                  )}
                  <div className="video__wrapper-progress">
                    <div className="video__wrapper-progress-bar" style={{ flexBasis: `${this.state.progressSpeedKit}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default ResultVideos
