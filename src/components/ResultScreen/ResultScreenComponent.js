import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ResultVideos from './ResultVideos/ResultVideos'
import ResultDetails from './ResultDetails/ResultDetails'

import './ResultScreen.css'
import ConfigForm from '../ConfigForm/ConfigForm'

class ResultScreenComponent extends Component {
  render() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    return (
      <div className="flex flex-column results__wrapper animated slideInUp" style={{animationDuration: '0.8s'}}>
        <div className="container pa2 pb7">
          <ConfigForm config={this.props.config} showConfig={false} onSubmit={this.props.onSubmit} />
        </div>
        <div className="flex-grow-1 results">
          <div className="container pa2">
            <div className="box-shadow results__box pa2" style={{ marginTop: '-96px' }}>
              {(competitorData && speedKitData) &&
              <ResultVideos competitorTest={this.props.competitorTest} speedKitTest={this.props.speedKitTest}/>}
              {(competitorData && speedKitData) &&
              <ResultDetails competitorTest={this.props.competitorTest} speedKitTest={this.props.speedKitTest}/>}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

ResultScreenComponent.propTypes = {
  onSubmit: PropTypes.func.isRequired,
}

export default ResultScreenComponent
