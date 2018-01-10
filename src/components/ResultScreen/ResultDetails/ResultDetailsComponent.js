import React, { Component } from 'react'

import './ResultDetails.css'
import { roundToHundredths, zeroSafeDiv } from '../../../helper/maths'

const metrics = [
  {
    name: 'speedIndex',
    label: 'Speed Index',
    tooltip: ''
  },
  {
    name: 'firstMeaningfulPaint',
    label: '1st Meaningful Paint',
    tooltip: ''
  },
  {
    name: 'ttfb',
    label: 'Time To First Byte',
    tooltip: ''
  },
  {
    name: 'domLoaded',
    label: 'DOMContentLoaded',
    tooltip: ''
  },
  {
    name: 'fullyLoaded',
    label: 'FullyLoaded',
    tooltip: ''
  },
  {
    name: 'lastVisualChange',
    label: 'Last Visual Change',
    tooltip: ''
  },
]

class ResultDetailsComponent extends Component {
  render() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    return metrics.map((metric, index) => {
      const factor = roundToHundredths(zeroSafeDiv(competitorData[metric.name], speedKitData[metric.name]))

      return (
        <div key={index} className="flex justify-center">
          <div className="w-60">
            <div className="flex items-center pt1 pb1 border-top">
              <div className="w-third text-center">
                <span className="metricValue">{competitorData[metric.name]}ms</span>
              </div>
              <div className="w-third text-center">
                <span className="factor">{factor}x {factor > 1 ? 'Faster' : ''}</span>
                <br/>{metric.label}
              </div>
              <div className="w-third text-center">
                <span className="metricValue">{speedKitData[metric.name]}ms</span>
              </div>
            </div>
          </div>
        </div>
      )
    })
  }
}

export default ResultDetailsComponent
