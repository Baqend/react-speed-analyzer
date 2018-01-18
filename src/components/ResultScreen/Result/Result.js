import './Result.css'
import './ResultVideos.css'
import './ResultScale.css'

import React, { Component } from 'react'
import Collapse from 'react-css-collapse'

import { calculateFactor } from '../../../helper/resultHelper'

import ResultVideos from './ResultVideos'
import ResultScale from './ResultScale'
import ResultMetrics from './ResultMetrics'

class Result extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: false
    }
  }

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  renderHeader() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    return (
      <div className="flex items-center relative">
        {!this.props.speedKitError && (
          <div className="mainFactor text-center">
            { calculateFactor(competitorData[this.props.mainMetric], speedKitData[this.props.mainMetric]) }x
            <br/>
            Faster
          </div>
        )}
        <div className="w-50 flex-auto text-center pa1" style={{ background: '#f6f6f6' }}>
          <small><b>Your Website</b></small>
          <br/>
          <b>{ competitorData[this.props.mainMetric] }ms</b>
        </div>
        {!this.props.speedKitError && (
          <div className="w-50 flex-auto text-center pa1">
            <small><b>With Speedkit</b></small>
            <br/>
            <b>{ speedKitData[this.props.mainMetric] }ms</b>
          </div>
        )}
      </div>
    )
  }

  renderVideos() {
    return (
      <ResultVideos { ...this.props } />
    )
  }

  renderPSI() {
    return (
      <div className="flex">
        <div className="pa1 w-33 flex-auto text-center">
          <small className="faded">Domains</small>
          <br />
          <strong>-</strong>
        </div>
        <div className="pa1 w-33 flex-auto text-center">
          <small className="faded">Requests</small>
          <br />
          <strong>-</strong>
        </div>
        <div className="pa1 w-33 flex-auto text-center">
          <small className="faded">Response Size</small>
          <br />
          <strong>-</strong>
        </div>
      </div>
    )
  }

  renderScale() {
    return (
      <ResultScale { ...this.props } />
    )
  }

  renderDetails() {
    return (
      <div className="result__details">
        <Collapse isOpen={this.state.showDetails}>
          <div className="mb4">
            {/*<hr />*/}
            <h3 className="text-center mt5">Pagespeed Insights</h3>
            <hr />
            {this.renderPSI()}
            <hr />
            <h3 className="text-center mt5">Performance Details</h3>
            <ResultMetrics { ...this.props } />
          </div>
        </Collapse>

        {/*<hr />*/}

        <div className="flex pt1 pb2">
          <div className="w-100 text-center">
            <a onClick={this.toggleDetails}
              style={{ color: '#1967BE', fontSize: '14px', cursor: 'pointer', fontWeight: '400' }}>
              {this.state.showDetails ? (
                'Less Details -'
              ): (
                'More Details +'
              )}
            </a>
          </div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div>
        {this.renderHeader()}
        <hr />
        {this.renderVideos()}
        <div className="ph6">
          <hr />
          {/*<h3 className="text-center mt3 mb0">Industry Comparison</h3>*/}
          {this.renderScale()}
          {this.renderDetails()}
        </div>
      </div>
    )
  }
}

export default Result
