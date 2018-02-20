import './Result.css'
import './ResultVideos.css'
import './ResultScale.css'

import React, { Component } from 'react'
import Collapse from 'react-css-collapse'
import { Tooltip } from 'react-tippy'

import ResultVideos from './ResultVideos'
import ResultScale from './ResultScale'
import ResultMetrics from './ResultMetrics'

import { formatFileSize } from 'helper/utils'
import { calculateAbsolute } from 'helper/resultHelper'

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
    const { mainMetric, speedKitError, testOverview } = this.props.result
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    return (
      <div>
        <div className="flex items-center relative">
          {!speedKitError && (
            <div className="mainFactor text-center" title={tooltipText[mainMetric]} style={{ display: 'flex'}}>
              {calculateAbsolute(competitorData[mainMetric], speedKitData[mainMetric])}
              <br/>
              Faster
            </div>
          )}
          <div className="w-50 flex-auto text-center pa1 pr4 pr0-ns" style={{ background: '#f6f6f6' }}>
            <small>
              {testOverview.speedKitVersion ? (
                <b>Without Speed Kit</b>
              ) : (
                <b>Your Website</b>
              )}
            </small>
            <br/>
            <Tooltip title={tooltipText[mainMetric]} arrow>
              <b>{ competitorData[mainMetric] }ms</b>
            </Tooltip>
          </div>
          {!speedKitError && (
            <div className="w-50 flex-auto text-center pa1 pl4 pl0-ns" style={{ background: '#f6f6f6' }}>
              <small>
                {testOverview.speedKitVersion ? (
                  <b>With Speed Kit {testOverview.speedKitVersion}</b>
                ) : (
                  <b>With Speed Kit</b>
                )}
              </small>
              <br/>
              <Tooltip title={tooltipText[mainMetric]} arrow>
                <b>{ speedKitData[mainMetric] }ms</b>
              </Tooltip>
            </div>
          )}
        </div>
        {mainMetric !== "speedIndex" && (
          <div>
            <hr />
            <div className="pa2 text-center" style={{ fontSize: 12 }}>
              <span className="dn dib-ns">Because your website uses a lot of asynchrounous resources, w</span><span className="dib dn-ns">W</span>e replaced the speed index metric by the first meaningful paint!
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
          <Tooltip title="Number of unique hosts referenced by the page." position="top" arrow>
            <small className="faded">Domains</small>
            <br />
            {psiDomains ? (
              <strong>{psiDomains}</strong>
            ) : (
              <strong>-</strong>
            )}
          </Tooltip>
        </div>
        <div className="pa1 w-33 flex-auto text-center">
          <Tooltip title="Number of HTTP resources loaded by the page." position="top" arrow>
            <small className="faded">Requests</small>
            <br />
            {psiRequests ? (
              <strong>{psiRequests}</strong>
            ) : (
              <strong>-</strong>
            )}
          </Tooltip>
        </div>
        <div className="pa1 w-33 flex-auto text-center" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <Tooltip title="Number of uncompressed response bytes for resources on the page." position="top" arrow>
            <small className="faded">Response Size</small>
            <br />
            {psiResponseSize ? (
              <strong>{formatFileSize(psiResponseSize, 2)}</strong>
            ) : (
              <strong>-</strong>
            )}
          </Tooltip>
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
            <hr className="mt3" style={{ marginTop: 24 }}/>
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
