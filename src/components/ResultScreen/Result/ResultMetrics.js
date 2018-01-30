import React, { Component } from 'react'

import { calculateFactor } from '../../../helper/resultHelper'

const metrics = [
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
  render() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    return (
      <div className="result__details-metrics">
        <div className="flex items-center pt1 pb1 border-top">
          <div className="w-third text-center faded">
            Your Webite
          </div>
          <div className="w-third text-center faded">
            Metric
          </div>
          <div className="w-third text-center faded">
            With Speed Kit
          </div>
        </div>
        {competitorData && speedKitData && metrics.map((metric, index) => {
          const factor = calculateFactor(competitorData[metric.name], speedKitData[metric.name])
          return (
            <div key={index} className="flex justify-center">
              <div className="w-100">
                <hr/>
                <div className="flex items-center pt1 pb1 border-top">
                  <div className="w-third text-center">
                    <div className="metricValue">{competitorData[metric.name]}ms</div>
                  </div>
                  <div className="w-third text-center">
                    <div className="factor">{factor}x {factor > 1 ? 'Faster' : ''}</div>
                    <div className="metricLabel">{metric.label}</div>
                  </div>
                  <div className="w-third text-center">
                    <div className="metricValue">{speedKitData[metric.name]}ms</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <hr />
        <div className="flex items-center pt1 pb1 border-top">
          <div className="w-third text-center">
            <small><a href={this.props.competitorTest.summaryUrl} className="">Detailed Report</a></small>
          </div>
          <div className="w-third text-center">
          </div>
          <div className="w-third text-center">
            <small><a href={this.props.speedKitTest.summaryUrl} className="">Detailed Report</a></small>
          </div>
        </div>
      </div>
    )
  }
}

export default ResultMetrics
