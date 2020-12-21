import React, { Component } from 'react'
import ReactTooltip from 'react-tooltip'
import './ResultMetrics.css'
import { calculateFactor, calculateAbsolute, calculatePercent } from '../../../../helper/resultHelper';
import Collapse from 'react-css-collapse'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import Barcut from '../BarCut/Barcut'

const userMetrics = [
  {
    name: 'firstMeaningfulPaint',
    label: '1st Meaningful Paint',
    tooltip: 'Represents the time when a page\'s primary content appears on the screen.'
  },
  {
    name: 'largestContentfulPaint',
    label: 'Largest Contentful Paint',
    tooltip: 'Represents the time when the largest content element in the viewport becomes visible.'
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

const metrics = userMetrics.concat(technicalMetrics)

class ResultMetrics extends Component {
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

  getFactorValue(competitorMetric, speedKitMetric) {
    const factor = calculateFactor(competitorMetric, speedKitMetric)
    const percent = calculatePercent(competitorMetric, speedKitMetric)
    return this.props.result.useFactor ? `${factor}x` : `${percent}%`
  }

  getHighlightMetrics() {
    const highlightMetrics = []
    const { testOverview } = this.props.result
    if (!testOverview || !testOverview.factors) {
      return highlightMetrics
    }

    const positiveFactors = Object.entries(testOverview.factors)
      .map(([metric, factor]) => ({metric, factor}))
      .filter(entry => {
        const mainMetric = this.props.result.mainMetric
        const metricToRemove = mainMetric === 'largestContentfulPaint' ? 'firstMeaningfulPaint' : 'largestContentfulPaint'
        return entry.factor > 1 && entry.metric !== metricToRemove && entry.metric !== 'load'
      }) // Load event should not be displayed as metric
      .sort((curr, prev) => {
        if (curr.metric === 'ttfb') {
          return -1
        }

        if (curr.metric === this.props.result.mainMetric && prev.metric !== 'ttfb') {
          return -1
        }

        if (prev.metric === this.props.result.mainMetric || prev.metric === 'ttfb') {
          return 1
        }

        return prev.factor - curr.factor
      })

    return positiveFactors.map(entry => entry.metric).slice(0, 3)
  }

  renderHighlightMetrics() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    return (
      <div className="flex flex-row items-center flex-wrap" style={{margin: '0 -10px'}}>
        {this.getHighlightMetrics().map((metric, index) => (
          <div key={index} className="flex flex-column justify-center box-wrapper" style={{margin: '10px', padding: '40px 24px', alignItems: 'center'}}>
            <div className="mb2" style={{width: '200px', margin: 'auto'}}>
              <div className="competitor-metric-scale mb1" style={{height: '40px'}}/>
              <div className="flex flex-row" style={{height: '40px'}}>
                <div className="speedKit-metric-scale" style={{width: 100 - (competitorData[metric] - speedKitData[metric]) / competitorData[metric] * 100 + '%'}}/>
                <div className="flex" style={{width: (competitorData[metric] - speedKitData[metric]) / competitorData[metric] * 100 + '%'}}>
                  <Barcut/>
                  <div className="speedKit-metric-scale-save"/>
                </div>
              </div>
            </div>
            <div className="text-light-grey mt3">{metrics.find(metricEntry => metricEntry.name === metric).label}</div>
            <div className="faster" style={{ flexDirection: 'row' }}>{calculateAbsolute(competitorData[metric], speedKitData[metric])} Faster
              (<span className="purple factor">{this.getFactorValue(competitorData[metric], speedKitData[metric])}</span>)
            </div>
          </div>
        ))}
      </div>
    )
  }

  renderCompetitorSpeedKitTable() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    return (
      <div className="result__details-metrics">
        {metrics.filter(entry => {
          const mainMetric = this.props.result.mainMetric
          const metricToRemove = mainMetric === 'largestContentfulPaint' ? 'firstMeaningfulPaint' : 'largestContentfulPaint'
          return entry.name !== metricToRemove
        }).map((metric, index) => {
          const absolute = calculateAbsolute(competitorData[metric.name], speedKitData[metric.name])
          const factor = calculateFactor(competitorData[metric.name], speedKitData[metric.name])
          const percent = calculatePercent(competitorData[metric.name], speedKitData[metric.name])
          const factorValue = this.props.result.useFactor ? `${factor}x` : `${percent}%`
          return (
            <div key={index} className="flex justify-center">
              <div className="w-100">
                {index !== 0 && <hr/>}
                <div className="flex flex-row items-center pt3 pb3">
                  <div className="metric-column text-center">
                    {competitorData[metric.name] ? (
                      <div className="metricValue pl2 pl0-ns">{competitorData[metric.name]} ms</div>
                    ):(<div className="metricValue">-</div>)}
                  </div>
                  <div className="flex flex-column factor-column" style={{ alignItems: 'center' }}>
                    <div data-tip data-for={metric.name}>
                      <div className="text-light-grey">{metric.label}</div>
                      {(absolute && factor) && (
                        <div className="faster">
                          <div className="faster-value">{absolute}{factor > 1 ? ' Faster' : ''}</div>
                          <div>(<span className="purple factor">{factorValue}</span>)</div>
                        </div>
                      )}
                    </div>
                    <ReactTooltip id={metric.name} type='dark' place='top' effect='solid'>
                      <span>{metric.tooltip}</span>
                    </ReactTooltip>
                  </div>
                  <div className="metric-column text-center">
                    {speedKitData[metric.name] ? (
                      <div className="metricValue pr2 pr0-ns">{speedKitData[metric.name]} ms</div>
                    ):(<div className="metricValue">-</div>)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    return (
      <div className="result__details-metrics">
        {this.renderHighlightMetrics()}
        <Collapse className={`result-details-collapse ${this.state.showDetails ? '' : 'fade-out'}`} isOpen={this.state.showDetails}>
          { this.renderCompetitorSpeedKitTable() }
        </Collapse>
        <div className="pb1">
          <div className="details-toggle-wrapper ">
            <div className="details-toggle" onClick={this.toggleDetails}>
              {this.state.showDetails ?
                (
                  <span>Hide Metrics <FontAwesomeIcon className="details-toggle-arrow" icon={ faChevronUp } /></span>
                ) : (
                  <span>Show All Metrics <FontAwesomeIcon className="details-toggle-arrow" icon={ faChevronDown } /></span>
                )
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ResultMetrics
