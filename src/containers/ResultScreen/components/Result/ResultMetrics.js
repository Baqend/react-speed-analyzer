import React, { Component } from 'react'
import ReactTooltip from 'react-tooltip'
import './ResultMetrics.css'
import { calculateFactor, calculateAbsolute } from 'helper/resultHelper'

const userMetrics = [
  {
    name: 'firstMeaningfulPaint',
    label: '1st Meaningful Paint',
    tooltip: 'Represents the time when a page\'s primary content appears on the screen.'
  },
  {
    name: 'speedIndex',
    label: 'Speed Index',
    tooltip: 'Represents how quickly the page rendered the user-visible content.'
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

const createWaterfallLink = (testResult) => {
  if (testResult.publishedSummaryUrl) {
    return testResult.publishedSummaryUrl
  }
  if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_TYPE === 'modules') {
    return `https://${process.env.REACT_APP_BAQEND}.app.baqend.com/v1/code/publishWaterfalls?id=${testResult.id}`
  }
  return `/v1/code/publishWaterfalls?id=${testResult.id}`
}

class ResultMetrics extends Component {

  renderCompetitorSpeedKitTable() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    return (
      <div className="result__details-metrics">
        {userMetrics.map((metric, index) => {
          const factor = calculateFactor(competitorData[metric.name], speedKitData[metric.name])
          const absolute = calculateAbsolute(competitorData[metric.name], speedKitData[metric.name])
          return (
            <div key={index} className="flex justify-center">
              <div className="w-100">
                {index !== 0 && <hr/>}
                <div className="flex flex-row items-center pt3 pb3">
                  <div className="metric-column text-center">
                    {competitorData[metric.name] ? (
                      <div className="metricValue">{competitorData[metric.name]} ms</div>
                    ):(<div className="metricValue">-</div>)}
                  </div>
                  <div className="factor-column text-center">
                    <div data-tip data-for={metric.name}>
                      <div className="metricLabel">{metric.label}</div>
                      {(absolute && factor) && <div className="faster">
                        {absolute} {factor > 1 ? 'Faster' : ''} (<span className="purple factor">{factor}x</span>)
                      </div>}
                    </div>
                    <ReactTooltip id={metric.name} type='dark' place='top' effect='solid'>
                      <span>{metric.tooltip}</span>
                    </ReactTooltip>
                  </div>
                  <div className="metric-column text-center">
                    {speedKitData[metric.name] ? (
                      <div className="metricValue">{speedKitData[metric.name]} ms</div>
                    ):(<div className="metricValue">-</div>)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <hr/>
        {technicalMetrics.map((metric, index) => {
          const factor = calculateFactor(competitorData[metric.name], speedKitData[metric.name])
          const absolute = calculateAbsolute(competitorData[metric.name], speedKitData[metric.name])
          return (
            <div key={index} className="flex justify-center">
              <div className="w-100">
                {index !== 0 && <hr/>}
                <div className="flex items-center pt3 pb3">
                  <div className="metric-column text-center display-desktop">
                    {competitorData[metric.name] ? (
                      <div className="metricValue">{competitorData[metric.name]} ms</div>
                    ):(<div className="metricValue">-</div>)}
                  </div>
                  <div className="factor-column text-center display-desktop">
                    <div data-tip data-for={metric.name}>
                      <div className="metricLabel">{metric.label}</div>
                      {(absolute && factor) && <div className="faster">
                        {absolute} {factor > 1 ? 'Faster' : ''} (<span className="purple factor">{factor}x</span>)
                      </div>}
                    </div>
                    <ReactTooltip id={metric.name} type='dark' place='top' effect='solid'>
                      <span>{metric.tooltip}</span>
                    </ReactTooltip>
                  </div>
                  <div className="metric-column text-center display-desktop">
                    {speedKitData[metric.name] ? (
                      <div className="metricValue">{speedKitData[metric.name]} ms</div>
                    ):(<div className="metricValue">-</div>)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {/*<h3 className="text-center mt5">WebPagetest Waterfalls</h3>*/}
        {/*<hr />*/}
        {/*<div className="flex items-center border-top">*/}
        {/*  <div className="w-50 tc pt1 pb1">*/}
        {/*    <a href={createWaterfallLink(this.props.competitorTest)} target="_blank" rel="noopener noreferrer" className="">Without Speed Kit</a>*/}
        {/*  </div>*/}
        {/*  <div className="w-50 tc pt1 pb1" style={{ borderLeft: '1px solid #E8E8E8' }}>*/}
        {/*    <a href={createWaterfallLink(this.props.speedKitTest)} target="_blank" rel="noopener noreferrer" className="">With Speed Kit</a>*/}
        {/*  </div>*/}
        {/*</div>*/}
        {/*<hr />*/}
        {/*<div className="flex items-center pt1 pb0 border-top mt3">
          <div className="w-100 text-center pa1">
            <a className="btn btn-ghost" href="">Get Full Report by Email</a>
          </div>
        </div>*/}
      </div>
    )
  }

  renderCompetitorTable() {
    const competitorData = this.props.competitorTest.firstView
    return (
      <div className="result__details-metrics">
        <hr />
        {userMetrics.map((metric, index) => (
          <div key={index} className="flex justify-center">
            <div className="w-100">
              {index !== 0 && <hr/>}
              <div data-tip data-for={metric.name}>
                <div className="flex flex-column items-center pt1 pb1">
                  <div className="pt1 pb1">
                    <div className="metricValue faded">{metric.label}</div>
                  </div>
                  <div>
                    {competitorData[metric.name] ? (
                      <div className="metricValue">{competitorData[metric.name]} ms</div>
                    ):(<div className="metricValue">-</div>)}
                  </div>
                </div>
              </div>
              <ReactTooltip id={metric.name} type='dark' place='top' effect='solid'>
                <span>{metric.tooltip}</span>
              </ReactTooltip>
            </div>
          </div>
        ))}
        <hr />
        {technicalMetrics.map((metric, index) => (
          <div key={index} className="flex justify-center">
            <div className="w-100">
              {index !== 0 && <hr/>}
              <div data-tip data-for={metric.name}>
                <div className="flex flex-column items-center pt1 pb1">
                  <div className="pt1 pb1">
                    <div className="metricValue faded">{metric.label}</div>
                  </div>
                  <div>
                    {competitorData[metric.name] ? (
                      <div className="metricValue">{competitorData[metric.name]} ms</div>
                    ):(<div className="metricValue">-</div>)}
                  </div>
                </div>
              </div>
              <ReactTooltip id={metric.name} type='dark' place='top' effect='solid'>
                <span>{metric.tooltip}</span>
              </ReactTooltip>
            </div>
          </div>
        ))}
        {/*<hr />*/}
        {/*<h3 className="text-center mt5">WebPagetest Waterfalls</h3>*/}
        {/*<hr />*/}
        {/*<div className="flex items-center border-top">*/}
        {/*  <div className="w-100 tc pt1 pb1">*/}
        {/*    <a href={createWaterfallLink(this.props.competitorTest)} target="_blank" rel="noopener noreferrer" className="">Your Website</a>*/}
        {/*  </div>*/}
        {/*</div>*/}
        {/*<hr />*/}
      </div>
    )
  }

  render() {
    const { speedKitError } = this.props.result
    return speedKitError ? this.renderCompetitorTable() : this.renderCompetitorSpeedKitTable()
  }
}

export default ResultMetrics
