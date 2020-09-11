import React, { Component } from 'react'
import './ResultVideos.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay } from '@fortawesome/free-solid-svg-icons'
import { isIE, isEdge } from 'helper/utils'

class ResultVideos extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isRunningCompetitor: false,
      isRunningSpeedKit: false,
      progressCompetitor: 0,
      progressSpeedKit: 0,
    }
  }

  playVideos = (videoLabel) => {
    this[videoLabel].currentTime = 0
    const playPromise = this[videoLabel].play()
    const secondVideo = videoLabel === 'speedKitVideo' ? 'competitorVideo' : 'speedKitVideo'
    if (isIE() || isEdge()) {
      if (this[secondVideo]) {
        this[secondVideo].currentTime = 0
        this[secondVideo].play()
      }
    } else if (playPromise !== undefined) {
      playPromise.then(() => {
        if (this[secondVideo]) {
          this[secondVideo].currentTime = 0
          this[secondVideo].play()
        }
      }).catch(error => {
      })
    }
  };

  handleCompetitorStarted = () => {
    this.setState({ isRunningCompetitor: false }, () => {
      setTimeout(() => {
        this.setState({ isRunningCompetitor: true })
      }, 100)
    })
  };

  handleSpeedKitStarted = () => {
    this.setState({ isRunningSpeedKit: false }, () => {
      setTimeout(() => {
        this.setState({ isRunningSpeedKit: true })
      }, 100)
    })
  };

  handleCompetitorProgress = () => {
    const percent = (this.competitorVideo.currentTime / this.competitorVideo.duration) + 0.05
    this.setState({
      progressCompetitor: percent,
    })
  };

  handleSpeedKitProgress = () => {
    if (this.speedKitVideo) {
      const percent = (this.speedKitVideo.currentTime / this.speedKitVideo.duration) + 0.05;
      this.setState({
        progressSpeedKit: percent,
      })
    }
  };

  handleCompetitorEnded = () => {
    this.setState({ isRunningCompetitor: false })
  };

  handleSpeedKitEnded = () => {
    this.setState({ isRunningSpeedKit: false })
  };

  componentDidMount() {
    if (this.competitorVideo) {
      this.competitorVideo.addEventListener('playing', this.handleCompetitorStarted)
      this.competitorVideo.addEventListener('timeupdate', this.handleCompetitorProgress)
      this.competitorVideo.addEventListener('ended', this.handleCompetitorEnded)
    }

    if (this.speedKitVideo) {
      this.speedKitVideo.addEventListener('playing', this.handleSpeedKitStarted)
      this.speedKitVideo.addEventListener('timeupdate', this.handleSpeedKitProgress)
      this.speedKitVideo.addEventListener('ended', this.handleSpeedKitEnded)
    }
  }

  componentWillUnmount() {
    if (this.competitorVideo) {
      this.competitorVideo.removeEventListener('playing', this.handleCompetitorStarted)
      this.competitorVideo.removeEventListener('timeupdate', this.handleCompetitorProgress)
      this.competitorVideo.removeEventListener('ended', this.handleCompetitorEnded)
    }

    if (this.speedKitVideo) {
      this.speedKitVideo.removeEventListener('playing', this.handleSpeedKitStarted)
      this.speedKitVideo.removeEventListener('timeupdate', this.handleSpeedKitProgress)
      this.speedKitVideo.removeEventListener('ended', this.handleSpeedKitEnded)
    }
  }

  render() {
    const competitorVideoPath = this.props.competitorTest.videoFileFirstView
    const speedKitVideoPath = this.props.speedKitTest.videoFileFirstView
    return (
      <div className="flex justify-center">
        <div className={`w-50 competitor-video ${this.props.testOverview.mobile ? 'mobile' : ''}`}>
          <div className="video__wrapper">
            <div className="video__wrapper-inner">
              <div className="relative">
                <video id="competitorVideo"
                  playsInline
                  controls={false}
                  muted
                  autoPlay
                  className="embedVideo"
                  ref={(video) => {this.competitorVideo = video}}
                  onClick={() => this.playVideos('competitorVideo')}
                  onPlay={() => this.playVideos('competitorVideo')}
                  src={competitorVideoPath && `https://${process.env.REACT_APP_BAQEND}/v1${competitorVideoPath}`}/>

                {this.competitorVideo && this.competitorVideo.paused && (
                  <div className={'video__wrapper-play'}>
                    <div className="video__wrapper-play-inner dark-blue" onClick={() => this.playVideos('competitorVideo')}>
                      <FontAwesomeIcon icon={faPlay} className="play"/>
                    </div>
                  </div>
                )}
                <div className="video__wrapper-progress">
                  <div className="video__wrapper-progress-inner">
                    <div
                      className="video__wrapper-progress-bar dark-blue"
                      style={{
                        transform: `scaleX(${this.state.progressCompetitor})`,
                        transition: this.state.isRunningCompetitor ? 'all 0.5s linear' : 'all 0.01ms linear',
                      }}>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`w-50 speedKit-video ${this.props.testOverview.mobile ? 'mobile' : ''}`}>
          <div className="video__wrapper">
            <div className="video__wrapper-inner">
              <div className="relative">
                <video id="speedKitVideo"
                  playsInline
                  controls={false}
                  muted
                  autoPlay
                  className="embedVideo"
                  ref={(video) => {this.speedKitVideo = video}}
                  onClick={() => this.playVideos('speedKitVideo')}
                  onPlay={() => this.playVideos('speedKitVideo')}
                  src={speedKitVideoPath && `https://${process.env.REACT_APP_BAQEND}/v1${speedKitVideoPath}`}/>
                {this.speedKitVideo && this.speedKitVideo.paused && (
                  <div className={'video__wrapper-play'}>
                    <div className="video__wrapper-play-inner purple" onClick={() => this.playVideos('speedKitVideo')}>
                      <FontAwesomeIcon icon={faPlay} className="play"/>
                    </div>
                  </div>
                )}
                <div className="video__wrapper-progress">
                  <div className="video__wrapper-progress-inner">
                    <div
                      className="video__wrapper-progress-bar purple"
                      style={{
                        transform: `scaleX(${this.state.progressSpeedKit})`,
                        transition: this.state.isRunningSpeedKit ? 'all 0.5s linear' : 'all 0.01ms linear',
                      }}>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ResultVideos
