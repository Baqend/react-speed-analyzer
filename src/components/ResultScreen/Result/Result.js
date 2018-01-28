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
      <div>
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
            <div className="w-50 flex-auto text-center pa1" style={{ background: '#f6f6f6' }}>
              <small><b>With Speedkit</b></small>
              <br/>
              <b>{ speedKitData[this.props.mainMetric] }ms</b>
            </div>
          )}
        </div>
        {this.props.mainMetric !== "speedIndex" && [
          <hr />,
          <div className="pa1 text-center">
            <small>
              Because your website uses a lot of asynchrounous resources, we replaced the speed index metric by the first meaningful paint!
            </small>
          </div>,
          <hr />
        ]}
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
          <strong>{this.props.testOverview.psiDomains}</strong>
        </div>
        <div className="pa1 w-33 flex-auto text-center">
          <small className="faded">Requests</small>
          <br />
          <strong>{this.props.testOverview.psiRequests}</strong>
        </div>
        <div className="pa1 w-33 flex-auto text-center">
          <small className="faded">Response Size</small>
          <br />
          <strong>{this.props.testOverview.psiResponseSize}</strong>
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
            <hr className="mt3"/>
            <h3 className="text-center mt5">Pagespeed Insights</h3>
            {this.renderPSI()}
            <hr />
            <h3 className="text-center mt5">Performance Details</h3>
            <ResultMetrics { ...this.props } />
          </div>
        </Collapse>


        <div className="pt3 pb2">
          <hr />
          <div className="mt2 w-100 text-center relative">
            <a className="result__details-toggle" onClick={this.toggleDetails}
              style={{ color: '#1967BE', fontSize: '14px', cursor: 'pointer', fontWeight: '400' }}>
              <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                {this.state.showDetails ? (
                  <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path>
                ): (
                  <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
                )}
              </svg>
            </a>
            <small>{this.state.showDetails ? 'Hide Details' : 'Show Details'}</small>
          </div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div>
        {this.renderHeader()}
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
