import React, { Component } from 'react'
import { Tooltip } from 'react-tippy'

import { calculateFactor } from '../../../helper/resultHelper'

const userMetrics = [
  {
    name: 'speedIndex',
    label: 'Speed Index',
    tooltip: 'Represents how quickly the page rendered the user-visible content.'
  },
  {
    name: 'firstMeaningfulPaint',
    label: '1st Meaningful Paint',
    tooltip: 'Represents the time when a page\'s primary content appears on the screen.'
  },
]

const technicalMetrics = [
  {
    name: 'ttfb',
    label: 'Time To First Byte',
    tooltip: 'Measures the amount of time between creating a connection to the server and downloading the contents.'
  },
  {
    name: 'domLoaded',
    label: 'DOMContentLoaded',
    tooltip: 'Represents the time when the initial HTML document has been completely loaded and parsed, without ' +
    'waiting for external resources.'
  },
  {
    name: 'fullyLoaded',
    label: 'FullyLoaded',
    tooltip: 'Measures the time from the start of the initial navigation until there was 2 seconds of no network ' +
    'activity after Document Complete.'
  },
  {
    name: 'lastVisualChange',
    label: 'Last Visual Change',
    tooltip: 'Represents the last point in the test when something visually changed on the screen.'
  },
]

class ResultMetrics extends Component {

  renderCompetitorSpeedKitTable() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    return (
      <div className="result__details-metrics">
        <h3 className="text-center mt5">User-perceived Performance</h3>
        {userMetrics.map((metric, index) => {
          const factor = calculateFactor(competitorData[metric.name], speedKitData[metric.name])
          return (
            <div key={index} className="flex justify-center">
              <div className="w-100">
                {index !== 0 && <hr/>}
                <div className="flex items-center pt1 pb1 border-top">
                  <div className="w-third text-center">
                    <div className="metricValue">{competitorData[metric.name]}ms</div>
                  </div>
                  <div className="w-third text-center">
                    <Tooltip title={metric.tooltip} position="top" arrow>
                      <div className="factor">{factor}x {factor > 1 ? 'Faster' : ''}</div>
                      <div className="metricLabel">{metric.label}</div>
                    </Tooltip>
                  </div>
                  <div className="w-third text-center">
                    <div className="metricValue">{speedKitData[metric.name]}ms</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <h3 className="text-center mt5">Technical Performance Metrics</h3>
        {technicalMetrics.map((metric, index) => {
          const factor = calculateFactor(competitorData[metric.name], speedKitData[metric.name])
          return (
            <div key={index} className="flex justify-center">
              <div className="w-100">
                {index !== 0 && <hr/>}
                <div className="flex items-center pt1 pb1 border-top">
                  <div className="w-third text-center">
                    <div className="metricValue">{competitorData[metric.name]}ms</div>
                  </div>
                  <div className="w-third text-center">
                    <Tooltip title={metric.tooltip} position="top" arrow>
                      <div className="factor">{factor}x {factor > 1 ? 'Faster' : ''}</div>
                      <div className="metricLabel">{metric.label}</div>
                    </Tooltip>
                  </div>
                  <div className="w-third text-center">
                    <div className="metricValue">{speedKitData[metric.name]}ms</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <h3 className="text-center mt5">WebPagetest Waterfalls</h3>
        <hr />
        <div className="flex items-center border-top">
          <div className="w-50 tc pt1 pb1">
            <a href={this.props.competitorTest.summaryUrl} className="">Your Website Report</a>
          </div>
          <div className="w-50 tc pt1 pb1 speedKitVideo">
            <a href={this.props.speedKitTest.summaryUrl} className="">Speed Kit Report</a>
          </div>
        </div>
        <hr />
        <div className="flex items-center pt1 pb0 border-top mt3">
          <div className="w-100 text-center pa1">
            <a className="btn btn-ghost" href="">Send Full Report</a>
          </div>
        </div>
      </div>
    )
  }

  renderCompetitorTable() {
    const competitorData = this.props.competitorTest.firstView
    return (
      <div className="result__details-metrics">
        <h3 className="text-center mt5">User-perceived Performance</h3>
        <hr />
        {userMetrics.map((metric, index) => (
          <div key={index} className="flex justify-center">
            <div className="w-100">
              {index !== 0 && <hr/>}
              <div className="flex items-center border-top">
                <div className="w-50 tr pt2 pb2 pr2">
                  <div className="metricLabel">{metric.label}</div>
                </div>
                <div className="w-50 tl pt2 pb2 pl2 speedKitVideo">
                  <div className="metricValue">{competitorData[metric.name]}ms</div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <hr />
        <h3 className="text-center mt5">Technical Performance</h3>
        <hr />
        {technicalMetrics.map((metric, index) => (
          <div key={index} className="flex justify-center">
            <div className="w-100">
              {index !== 0 && <hr/>}
              <div className="flex items-center border-top">
                <div className="w-50 tr pt2 pb2 pr2">
                  <div className="metricLabel">{metric.label}</div>
                </div>
                <div className="w-50 tl pt2 pb2 pl2 speedKitVideo">
                  <div className="metricValue">{competitorData[metric.name]}ms</div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <hr />
        <h3 className="text-center mt5">WebPagetest Waterfalls</h3>
        <hr />
        <div className="flex items-center border-top">
          <div className="w-100 tc pt1 pb1">
            <a href={this.props.competitorTest.summaryUrl} className="">Your Website Report</a>
          </div>
        </div>
        <hr />
        <div className="flex items-center pt1 pb0 border-top mt3">
          <div className="w-100 text-center pa1">
            <a className="btn btn-ghost" href="">Send Full Report</a>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const speedKitError = this.props.speedKitError
    return speedKitError ? this.renderCompetitorTable() : this.renderCompetitorSpeedKitTable()
  }
}

export default ResultMetrics
