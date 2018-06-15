import './Result.css'
import './ResultVideos.css'
import './ResultScale.css'

import React, { Component } from 'react'
import Collapse from 'react-css-collapse'
import ReactTooltip from 'react-tooltip'

import ResultVideos from './ResultVideos'
import ResultScale from './ResultScale'
import ResultMetrics from './ResultMetrics'

import { formatFileSize } from 'helper/utils'
import { calculateFactor } from 'helper/resultHelper'

const tooltipText = {
  'speedIndex': 'Speed Index',
  'firstMeaningfulPaint': 'First Meaningful Paint',
  'ttfb': 'Time To First Byte',
}

class Result extends Component {
  constructor(props) {
    super(props)
    const { speedKitError } = this.props.result
    const { isSpeedKitComparison } = this.props.testOverview

    this.state = {
      showDetails: isSpeedKitComparison && speedKitError ? true : props.showDetails
    }
  }

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  renderHeader() {
    const { speedKitError, testOverview } = this.props.result
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    // flags that can be passed in by plesk
    const isPlesk = this.props.result.isPlesk
    const showTTFB = this.props.showTTFB

    // check whether the show TTFB flog was set by plesk
    const mainMetric = showTTFB ? 'ttfb' : this.props.result.mainMetric
    const factor = !speedKitError ? calculateFactor(competitorData[mainMetric], speedKitData[mainMetric]) : null

    return (
      <div>
        <div className="flex items-center relative">
          {((isPlesk && factor > 1 && !showTTFB) || (!isPlesk && !speedKitError) ) && (
            <div className="mainFactor text-center" title={tooltipText[mainMetric]}
              style={{ display: 'flex'}}>
              {factor}x
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
            <div data-tip data-for={mainMetric + 'CompetitorData'}>
              <b>{ competitorData[mainMetric] }ms</b>
            </div>
            <ReactTooltip id={mainMetric + 'CompetitorData'} type='dark' place='top' effect='solid'>
              <span>{tooltipText[mainMetric]}</span>
            </ReactTooltip>
          </div>
          {( !speedKitError ) && (
            <div className="w-50 flex-auto text-center pa1 pl4 pl0-ns" style={{ background: '#f6f6f6' }}>
              <small>
                {testOverview.speedKitVersion ? (
                  <b>With Speed Kit {testOverview.speedKitVersion}</b>
                ) : (
                  <b>With Speed Kit</b>
                )}
              </small>
              <br/>
              <div data-tip data-for={mainMetric + 'SpeedKitData'}>
                <b>{ speedKitData[mainMetric] }ms</b>
              </div>
              <ReactTooltip id={mainMetric + 'SpeedKitData'} type='dark' place='top' effect='solid'>
                <span>{tooltipText[mainMetric]}</span>
              </ReactTooltip>
            </div>
          )}
        </div>
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
          <div data-tip data-for='psiDomains'>
            <small className="faded">Domains</small>
            <br />
            {psiDomains ? (
              <strong>{psiDomains}</strong>
            ) : (
              <strong>-</strong>
            )}
          </div>
          <ReactTooltip id='psiDomains' type='dark' place='top' effect='solid'>
            <span>Number of unique hosts referenced by the page.</span>
          </ReactTooltip>
        </div>
        <div className="pa1 w-33 flex-auto text-center">
          <div data-tip data-for='psiRequests'>
            <small className="faded">Requests</small>
            <br />
            {psiRequests ? (
              <strong>{psiRequests}</strong>
            ) : (
              <strong>-</strong>
            )}
          </div>
          <ReactTooltip id='psiRequests' type='dark' place='top' effect='solid'>
            <span>Number of HTTP resources loaded by the page.</span>
          </ReactTooltip>
        </div>
        <div className="pa1 w-33 flex-auto text-center" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <div data-tip data-for='psiResponseSize'>
            <small className="faded">Response Size</small>
            <br />
            {psiResponseSize ? (
              <strong>{formatFileSize(psiResponseSize, 2)}</strong>
            ) : (
              <strong>-</strong>
            )}
          </div>
          <ReactTooltip id='psiResponseSize' type='dark' place='top' effect='solid'>
            <span>Number of uncompressed response bytes for resources on the page.</span>
          </ReactTooltip>
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
          <div className="mb4" style={{ fontSize: 16 }}>
            {/*<hr />*/}
            <hr className="mt3" style={{ marginTop: 24 }}/>
            <h3 className="text-center mt5">General Page Metrics</h3>
            {this.renderPSI()}
            <hr />
            <ResultMetrics { ...this.props } />
          </div>
        </Collapse>


        <div className="pt3 pb1">
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
