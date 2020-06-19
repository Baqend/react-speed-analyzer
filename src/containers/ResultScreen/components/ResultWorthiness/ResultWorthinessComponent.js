import React, { Component } from 'react'
import './ResultWorthiness.css'

class ResultWorthinessComponent extends Component {
  getStudyLink(studyName) {
    switch(studyName) {
      case 'amazon':
        return 'http://glinden.blogspot.com/2006/12/slides-from-my-talk-at-stanford.html'
      case 'eggplant':
        return 'https://blog.eggplantsoftware.com/case-studies/cook-increases-conversions-by-seven-percent-thanks-to-faster-load-time'
      case 'gq':
        return 'https://digiday.com/media/gq-com-cut-page-load-time-80-percent/'
      case 'pinterest':
        return ' https://medium.com/pinterest-engineering/driving-user-growth-with-performance-improvements-cfc50dafadd7'
      case 'otto':
        return 'https://www.thinkwithgoogle.com/intl/de-de/insights/markteinblicke/mobile-speed-race-der-otto-group-verbessert-mobile-ladezeiten/'
      case 'akamai':
        return 'https://blogs.akamai.com/2017/04/new-findings-the-state-of-online-retail-performance-spring-2017.html'
    }
  }

  render() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    const mainMetric = this.props.mainMetric
    const savedMilliseconds = competitorData[mainMetric] - speedKitData[mainMetric]

    return (
      <div className="flex flex-column text-center pt6">
        <h2 className="ma0">What can you expect from this <span className="purple">{savedMilliseconds} ms</span> improvement?</h2>
        <h3>Here is a range of potential outcomes from well-known studies.</h3>
        <div className="flex flex-wrap text-center" style={{margin: '0 -10px'}}>
          <div className="box-wrapper" style={{margin: '10px'}}>
            <div className="worthiness-header">
              <span className="purple">+{(savedMilliseconds/100).toFixed(2)}%</span> Revenue
            </div>
            <div className="text-light-grey">100 ms ≙ 1% Revenue</div>
            <a className="btn btn-blue btn-ghost mt4" href={this.getStudyLink('amazon')} target="_blank">Amazon Study</a>
          </div>
          <div className="box-wrapper" style={{margin: '10px'}}>
            <div className="worthiness-header">
              <span className="purple">+{(savedMilliseconds/100*0.8).toFixed(2)}%</span> Conversions
            </div>
            <div className="text-light-grey">100 ms ≙ 0.8% Conversions</div>
            <a className="btn btn-blue btn-ghost mt4" href={this.getStudyLink('eggplant')} target="_blank">Eggplant Study</a>
          </div>
        </div>
        <div className="flex flex-wrap text-center" style={{margin: '0 -10px'}}>
          <div className="box-wrapper" style={{margin: '10px'}}>
            <div className="worthiness-header">
              <span className="purple">+{(savedMilliseconds/100*1.6).toFixed(2)}%</span> Traffic
            </div>
            <div className="text-light-grey">100 ms ≙ 1.6% Traffic</div>
            <a className="btn btn-blue btn-ghost mt4" href={this.getStudyLink('gq')} target="_blank">GQ Study</a>
          </div>
          <div className="box-wrapper" style={{margin: '10px'}}>
            <div className="worthiness-header">
              <span className="purple">+{(savedMilliseconds/100*0.4).toFixed(2)}%</span> SEO-Traffic
            </div>
            <div className="text-light-grey">100 ms ≙ 0.4% SEO-Traffic</div>
            <a className="btn btn-blue btn-ghost mt4" href={this.getStudyLink('pinterest')} target="_blank">Pinterest Study</a>
          </div>
        </div>
        <div className="flex flex-wrap text-center" style={{margin: '0 -10px'}}>
          <div className="box-wrapper" style={{margin: '10px'}}>
            <div className="worthiness-header">
              <span className="purple">+{(savedMilliseconds/100*0.6).toFixed(2)}%</span> Session Length
            </div>
            <div className="text-light-grey">100 ms ≙ 0.6% Session Length</div>
            <a className="btn btn-blue btn-ghost mt4" href={this.getStudyLink('otto')} target="_blank">OTTO Study</a>
          </div>
          <div className="box-wrapper" style={{margin: '10px'}}>
            <div className="worthiness-header">
              <span className="purple">-{(savedMilliseconds/1000*18.4).toFixed(2)}%</span> Bounce Rate
            </div>
            <div className="text-light-grey">1 s ≙ -18.4% Bounce Rate</div>
            <a className="btn btn-blue btn-ghost mt4" href={this.getStudyLink('akamai')} target="_blank">Akamai Study</a>
          </div>
        </div>
      </div>
    )
  }
}

export default ResultWorthinessComponent
