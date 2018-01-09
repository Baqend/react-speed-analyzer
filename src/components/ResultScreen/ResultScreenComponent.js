import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Collapse } from 'reactstrap'

import './ResultScreen.css'
import ConfigForm from '../ConfigForm/ConfigForm'

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.toggleDetails = this.toggleDetails.bind(this)
    this.state = { showDetails: false }
  }

  toggleDetails() {
    this.setState({ showDetails: !this.state.showDetails })
  }

  render() {
    return (
      <div className="flex flex-column results__wrapper animated slideInUp" style={{animationDuration: '0.8s'}}>
        <div className="container pa2 pb7">
          <ConfigForm config={this.props.config} showConfig={false} onSubmit={this.props.onSubmit} />
        </div>
        <div className="flex-grow-1 results">
          <div className="container pa2">
            <div className="box-shadow results__box pa2" style={{ marginTop: '-96px' }}>
              <div className="flex flex-row flex-space-around pb1">
                <div className="text-center">
                  <span>Your Website</span>
                  <br/>
                  {this.props.competitorTest.firstView && this.props.competitorTest.firstView.speedIndex}ms
                </div>
                <div className="text-center">
                  <span>With Speedkit</span>
                  <br/>
                  <span>{this.props.speedKitTest.firstView && this.props.speedKitTest.firstView.speedIndex}ms</span>
                </div>
              </div>
              <div className="flex flex-row flex-space-around">
                <div className="pr6 pl6">
                  <video playsInline autoPlay controls className="embedVideo"
                    src={(this.props.competitorTest && this.props.competitorTest.videoFileFirstView) &&
                    'https://makefast.app.baqend.com/v1' + this.props.competitorTest.videoFileFirstView}
                  />
                </div>
                <div className="pr6 pl6">
                  <video playsInline autoPlay controls className="embedVideo"
                    src={(this.props.speedKitTest && this.props.speedKitTest.videoFileFirstView) &&
                    'https://makefast.app.baqend.com/v1' + this.props.speedKitTest.videoFileFirstView}
                  />
                </div>
              </div>
              <div className="flex flex-row flex-space-around text-center">
                <span onClick={this.toggleDetails}>show more</span>
              </div>
              <Collapse isOpen={this.state.showDetails}>
                <div className="flex flex-row flex-space-around text-center">
                  Hier folgen demnächst die weiteren Metriken!!!
                </div>
              </Collapse>
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
