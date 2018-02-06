import './Result.css'
import './ResultVideos.css'
import './ResultScale.css'

import React, { Component } from 'react'
import Collapse from 'react-css-collapse'
import { Tooltip } from 'react-tippy'

import { calculateFactor, calculateAbsolute } from '../../../helper/resultHelper'

import ResultVideos from './ResultVideos'
import ResultScale from './ResultScale'
import ResultMetrics from './ResultMetrics'
import { formatFileSize } from '../../../helper/utils'

const tooltipText = {
  'speedIndex': 'Speed Index',
  'firstMeaningfulPaint': 'First Meaningful Paint',
}

class Result extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: props.showDetails
    }
  }

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  renderHeader() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    console.log(this.props)
    return (
      <div>
        <div className="flex items-center relative">
          {!this.props.speedKitError && (
            <div className="mainFactor text-center" title={tooltipText[this.props.mainMetric]} style={{ display: 'flex'}}>
              {calculateAbsolute(competitorData[this.props.mainMetric], speedKitData[this.props.mainMetric])}
              <br/>
              Faster
            </div>
          )}
          <div className="w-50 flex-auto text-center pa1 pr4 pr0-ns" style={{ background: '#f6f6f6' }}>
            <small><b>Your Website</b></small>
            <br/>
            <Tooltip title={tooltipText[this.props.mainMetric]} arrow>
              <b>{ competitorData[this.props.mainMetric] }ms</b>
            </Tooltip>
          </div>
          {!this.props.speedKitError && (
            <div className="w-50 flex-auto text-center pa1 pl4 pl0-ns" style={{ background: '#f6f6f6' }}>
              <small><b>With Speedkit {this.props.result.speedKitVersion}</b></small>
              <br/>
              <Tooltip title={tooltipText[this.props.mainMetric]} arrow>
                <b>{ speedKitData[this.props.mainMetric] }ms</b>
              </Tooltip>
            </div>
          )}
        </div>
        {this.props.mainMetric !== "speedIndex" && (
          <div>
            <hr />
            <div className="pa1 text-center">
              <small>
                Because your website uses a lot of asynchrounous resources, we replaced the speed index metric by the first meaningful paint!
              </small>
            </div>
            <hr />
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
    // console.log(this.props)
    const psiDomains = this.props.testOverview && this.props.testOverview.psiDomains
    const psiRequests =  this.props.testOverview && this.props.testOverview.psiRequests
    const psiResponseSize = this.props.testOverview && this.props.testOverview.psiResponseSize

    return (
      <div className="flex">
        <div className="pa1 w-33 flex-auto text-center">
          <small className="faded">Domains</small>
          <br />
          {psiDomains ? (
            <strong>{psiDomains}</strong>
          ) : (
            <strong>-</strong>
          )}
        </div>
        <div className="pa1 w-33 flex-auto text-center">
          <small className="faded">Requests</small>
          <br />
          {psiRequests ? (
            <strong>{psiRequests}</strong>
          ) : (
            <strong>-</strong>
          )}
        </div>
        <div className="pa1 w-33 flex-auto text-center" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <small className="faded">Response Size</small>
          <br />
          {psiResponseSize ? (
            <strong>{formatFileSize(psiResponseSize, 2)}</strong>
          ) : (
            <strong>-</strong>
          )}
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
        <div className="ph2 ph6-ns">
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
