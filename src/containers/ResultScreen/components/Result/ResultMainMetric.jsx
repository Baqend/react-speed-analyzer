import React, { Component } from 'react'
import './ResultMainMetric.css'
import { isWholeNumberToHundreds, roundToNearestTen } from '../../../../helper/maths'
import { calculateFactor, calculatePercent } from '../../../../helper/resultHelper'
import ReactTooltip from 'react-tooltip'

const tooltipText = {
  'speedIndex': 'Speed Index',
  'firstMeaningfulPaint': 'First Meaningful Paint',
  'largestContentfulPaint': 'Largest Contentful Paint',
  'ttfb': 'Time To First Byte',
}

class ResultMainMetric extends Component {
  constructor(props) {
    super(props)
  }

  roundMainMetrics(mainMetric) {
    const { competitorError, speedKitError } = this.props.result
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    const competitorMainMetric = !competitorError ? competitorData[mainMetric] : null
    const speedKitMainMetric = !speedKitError ? speedKitData[mainMetric] : null

    if (competitorError || speedKitError) {
      return { competitorMainMetric, speedKitMainMetric }
    }

    //None of the both metrics is computed by us.
    if (!(isWholeNumberToHundreds(competitorMainMetric) || isWholeNumberToHundreds(speedKitMainMetric))) {
      return { competitorMainMetric, speedKitMainMetric }
    }

    const competitorNearestTen = roundToNearestTen(competitorMainMetric)
    const speedKitNearestTen = roundToNearestTen(speedKitMainMetric)

    //The both metrics are equal after rounding to nearest ten.
    if (competitorNearestTen === speedKitNearestTen) {
      return { competitorMainMetric, speedKitMainMetric }
    }

    return { competitorMainMetric: competitorNearestTen, speedKitMainMetric: speedKitNearestTen }
  }

  render() {
    const { mainMetric } = this.props.result
    const { competitorMainMetric, speedKitMainMetric } = this.roundMainMetrics(mainMetric)
    const factor = calculateFactor(competitorMainMetric, speedKitMainMetric)
    const percent = calculatePercent(competitorMainMetric, speedKitMainMetric)
    const factorValue = this.props.result.useFactor ? `${factor}x` : `${percent}%`
    return (
      <div>
        <div className="flex items-center relative">
          {(factor >= 1.1 && mainMetric !== 'ttfb') && (
            <i className="flex flex-column main-factor-cycle text-center" title={tooltipText[mainMetric]}>
              <span className={"main-factor-value"}>{factorValue}</span>
              Faster
            </i>
          )}
          <div className="w-50 flex-auto competitorMetric">
            <b className={"main-metric-title"}>Before Speed Kit</b>
            <br/>
            <div data-tip data-for={mainMetric + 'CompetitorData'}>
              <b className={"main-metric-value"}>{competitorMainMetric} ms</b>
            </div>
            <ReactTooltip id={mainMetric + 'CompetitorData'} type='dark' place='top' effect='solid'>
              <span>{tooltipText[mainMetric]}</span>
            </ReactTooltip>
          </div>
          <div className="w-50 flex-auto speedKitMetric">
            <b className={"main-metric-title"}>After Speed Kit</b>
            <br/>
            <div data-tip data-for={mainMetric + 'SpeedKitData'}>
              <b className={"main-metric-value"}>{speedKitMainMetric} ms</b>
            </div>
            <ReactTooltip id={mainMetric + 'SpeedKitData'} type='dark' place='top' effect='solid'>
              <span>{tooltipText[mainMetric]}</span>
            </ReactTooltip>
          </div>
        </div>
      </div>
    )
  }
}

export default ResultMainMetric
