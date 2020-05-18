import React, { Component } from 'react'
import Papercut from '../Papercut/Papercut'
import './ResultBody.css'
import barCut from 'assets/barCutGrey.svg'
import ResultMetrics from './ResultMetrics'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons'
import ResultAction from '../ResultAction/ResultAction'
import ResultWorthiness from '../ResultWorthiness/ResultWorthiness';

class ResultBody extends Component {
  constructor(props) {
    super(props)
  }

  createWaterfallLink = () => {
    const {competitorTest, speedKitTest} = this.props.result
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_TYPE === 'modules') {
      return `https://${process.env.REACT_APP_BAQEND}.app.baqend.com/v1/code/openVideoComparison?ids=${competitorTest.id},${speedKitTest.id}`
    }
    return `/v1/code/publishWaterfalls?id=${competitorTest.id},${speedKitTest.id}`
  }

  renderDetails() {
    return (
      <div className="pt6 result-details">
        <h2 className="mb1">Performance Metrics</h2>
        <div className="purple pb2" style={{ fontWeight: "600"}}>
          <a href={this.createWaterfallLink()} target="_blank"><FontAwesomeIcon icon={ faLongArrowAltRight } /> WebPageTest Results</a>
        </div>
        <ResultMetrics { ...this.props } />
      </div>
    )
  }

  renderScale() {
    const {competitorTest, speedKitTest, mainMetric} = this.props.result
    const competitor = competitorTest.firstView && competitorTest.firstView[mainMetric] ? competitorTest.firstView[mainMetric] : null
    const speedKit = speedKitTest.firstView && speedKitTest.firstView[mainMetric] ? speedKitTest.firstView[mainMetric] : null
    const scaleSave = competitor && speedKit ? (competitor - speedKit) / competitor * 100 : 0

    return (
      <div className="pt3 pb3 scale">
        <div className="flex flex-column scale-wrapper">
          <div className="scale-competitor">BEFORE</div>
          <div className="flex flex-row pt1">
            <div className="scale-speedKit" style={{width: 100 - scaleSave + '%'}}>AFTER</div>
            {scaleSave > 0 && <img src={barCut} className="bar-cut-image" alt="bar cut" />}
            {scaleSave > 0 && <div className="scale-save" style={{width: scaleSave + '%'}}>{competitor - speedKit} MS FASTER</div>}
          </div>
        </div>
      </div>
    )
  }

  render() {
    const {competitorError, speedKitError} = this.props.result
    return (
      <div className="flex-grow-1 flex flex-column result-body">
        <Papercut fillColor={"grey"} doRotation={false}/>
        {this.props.result.isFinished && !competitorError && (
          <div className="container result-body-inner">
            {!speedKitError && this.renderScale()}
            {!speedKitError && this.renderDetails()}
            <ResultAction { ...this.props } toggleModal={this.toggleModal}/>
            {!speedKitError && <ResultWorthiness
              competitorTest={this.props.competitorTest}
              speedKitTest={this.props.speedKitTest}
              mainMetric={this.props.result.mainMetric}
            />}
          </div>
        )}
      </div>
    )
  }
}

export default ResultBody
