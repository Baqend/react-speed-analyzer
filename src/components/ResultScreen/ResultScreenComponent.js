import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Collapse from 'react-css-collapse'

import './ResultScreen.css'
import ResultVideos from './ResultVideos/ResultVideos'
import ResultDetails from './ResultDetails/ResultDetails'
import ResultWorthiness from './ResultWorthiness/ResultWorthiness'

import ConfigForm from '../ConfigForm/ConfigForm'
import Slider from 'react-slick'

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showSettings: false,
      showDetails: false,
    }
    console.log(this.props.speedKitError)
  }

  toggle = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  toggleSettings = () => {
    this.setState({ showSettings: !this.state.showSettings })
  }

  render() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    const settings = {
      className: 'center',
      centerMode: true,
      infinite: true,
      centerPadding: '60px',
      slidesToShow: 3,
      speed: 500
    }

    return (
      <div className="flex flex-column results__wrapper animated slideInUp" style={{animationDuration: '0.8s'}}>
        <div className="container pa2 pb7">
          <ConfigForm config={this.props.config} showConfig={this.state.showSettings} onSubmit={this.props.onSubmit} />
          {!this.state.showSettings &&
            <div className="toggleSettings text-right">
              <span><a onClick={this.toggleSettings}>Show Settings</a></span>
            </div>
          }
        </div>
        <div className="flex-grow-1 results">
          {(competitorData && speedKitData) &&
          <div className="container pa2">
            <div className="box-shadow results__box" style={{ marginTop: '-96px' }}>
              <ResultVideos
                competitorTest={this.props.competitorTest}
                speedKitTest={this.props.speedKitTest}
                mainMetric={this.props.mainMetric}
                speedKitError={this.props.speedKitError}
              />
              <hr/>
              <div className="flex pa2">
                <div className="w-100 text-center">
                  <span onClick={this.toggle}>Detailed Performance Overview</span>
                </div>
              </div>
              <Collapse isOpen={this.state.showDetails}>
                <ResultDetails
                  competitorTest={this.props.competitorTest}
                  speedKitTest={this.props.speedKitTest}
                />
              </Collapse>
            </div>
            <Slider {...settings} className="pa3">
              <div className="slier-item">1</div>
              <div className="slier-item">2</div>
              <div className="slier-item">3</div>
              <div className="slier-item">4</div>
              <div className="slier-item">5</div>
            </Slider>
            <div>
              Sign Up
            </div>
            <ResultWorthiness
              competitorTest={this.props.competitorTest}
              speedKitTest={this.props.speedKitTest}
              mainMetric={this.props.mainMetric}
            />
          </div>}
        </div>
      </div>
    )
  }
}

ResultScreenComponent.propTypes = {
  mainMetric: PropTypes.string,
  speedKitError: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default ResultScreenComponent
