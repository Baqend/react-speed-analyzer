import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ConfigForm from './ConfigForm/ConfigForm'
import StatusCarousel from './StatusCarousel/StatusCarousel'

class StartingScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      items: [],
      headline: "We are running a series of tests against your site",
      details: "See how fast your current backend stack delivers your site to users. We will compare the results to a version of your site using Baqend Speed Kit"
    }
  }

  componentDidMount() {
    // this.setState({ items: this.props.children })
    const items = [
      <h2 className="text__headline">{this.state.headline}</h2>,
      <div className="text__details">{this.state.details}</div>
    ]
    this.setState({ items: items })
    setInterval(() => {
      if (!this.state.items.length) {
        this.setState({ items: items })
      } else {
        this.setState({ items: [] })
      }
    }, 10000)
  }

  render() {
    return (
      <div className="device device__laptop">
        {/*<div className="text-center">
          <h1>Page Speed Analyzer</h1>
          <span>Test the performance of your site!</span>
        </div>
        <ConfigForm config={this.props.config} onSubmit={this.props.onSubmit} />*/}
        <div className="loading">
          <div className="loading__spinner animated slideInUp" style={{display: 'none'}}>
            <div className="spinner__wrapper">
              <svg className="spinner" width="100%" height="100%" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                <circle className="path" fill="none" strokeWidth="2" strokeLinecap="round" cx="33" cy="33" r="30"></circle>
              </svg>
            </div>
          </div>
          <div className="loading__status">
            <div className="text">
              <h2 className="text__headline">{this.state.headline}</h2>
              <div className="text__details">{this.state.details}</div>
            </div>
          </div>
        </div>
        <StatusCarousel items={this.state.items} />
        {/*<StatusCarousel>
          <h2 className="text__headline">{this.state.headline}</h2>
          <div className="text__details">{this.state.details}</div>
        </StatusCarousel>*/}
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
