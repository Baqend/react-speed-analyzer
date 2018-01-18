import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Collapse from 'react-css-collapse'

import './ResultScreen.css'
import Result from './Result/Result'
import ResultWorthiness from './ResultWorthiness/ResultWorthiness'

import ConfigForm from '../ConfigForm/ConfigForm'
import Carousel from '../Carousel/Carousel'

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showSettings: false,
      showDetails: false,
    }
  }

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  toggleSettings = () => {
    this.setState({ showSettings: !this.state.showSettings })
  }

  render() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    return (
      <div className="flex flex-column results__wrapper animated2 slideInUp2" style={{animationDuration: '0.8s'}}>
        <div className="container pa2 pb7">
          <div className="mb1">
            <ConfigForm config={this.props.config} showConfig={this.state.showSettings} onSubmit={this.props.onSubmit} />
          </div>
          {!this.state.showSettings &&
            <div className="toggleSettings text-right">
              <span><a onClick={this.toggleSettings}>Show Settings</a></span>
            </div>
          }
        </div>
        <div className="flex-grow-1 results">
          <div className="container pa2">
            <div className="box-shadow results__box" style={{ marginTop: '-96px' }}>
              { competitorData && speedKitData && <Result { ...this.props } /> }
            </div>
          </div>


          {(competitorData && speedKitData) &&
            <div>
              <div className="container pa2">
                <div className="text-center pt0 pb2">
                  {/*<h2 className="mb1">Boost Your Website</h2>
                  <div>Supercharge your website by adding three lines of code.</div>*/}
                  <a href="" className="btn btn-orange ma1">Boost Your Website</a>
                  <a href="" className="btn btn-orange btn-ghost ma1">Contact Us</a>
                </div>

              </div>
              <div>
                <div style={{ background: 'white' }}>
                  <div className="pv6">
                    <Carousel showFirstPool={true}/>
                    <Carousel showFirstPool={true}/>
                  </div>
                  <div className="container pa2 pv6">
                    <ResultWorthiness
                      competitorTest={this.props.competitorTest}
                      speedKitTest={this.props.speedKitTest}
                      mainMetric={this.props.mainMetric}
                    />
                  </div>
                </div>

                <div className="banner">
                  <div className="container ph2 pv6">
                    <div className="flex items-center">
                      <div className="w-50 text-right pa2">
                        <h2 className="ma1">Try Baqend Speed Kit Today!</h2>
                        Make your websites load instantly
                      </div>
                      <div className="w-50 pa2 text-left">
                        <a
                          href="https://www.baqend.com/speedkit.html?_ga=2.235057797.527125052.1516095583-312811701.1516095583"
                          className="btn btn-white ma1"
                        >
                           Learn More
                        </a>
                        <a
                          href="https://dashboard.baqend.com/register?appType=speedkit&_ga=2.230289688.527125052.1516095583-312811701.1516095583"
                          className="btn btn-orange ma1">Get Started for Free
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          }
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
