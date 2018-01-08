import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { shuffle } from '../../helper/utils'

import ConfigForm from '../ConfigForm/ConfigForm'
import { StatusCarousel, StatusPage } from './StatusCarousel/StatusCarousel'

const funFacts = shuffle([
  <StatusPage key="2">
    <h2 className="text__headline">Fun Fact #1</h2>
    <div className="text__details">Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec sed odio dui.</div>
    <div className="text_details">Donec sed odio dui!</div>
  </StatusPage>,
  <StatusPage key="3">
    <h2 className="text__headline">Fun Fact #2</h2>
    <div className="text__details">Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio, dapibus ac facilisis in, egestas eget quam.</div>
  </StatusPage>,
  <StatusPage key="4">
    <h2 className="text__headline">Fun Fact #3</h2>
    <div className="text__details">Nulla vitae elit libero, a pharetra augue. Curabitur blandit tempus porttitor.</div>
  </StatusPage>
])


class StartingScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      status: 0,
      showCarousel: false,
      showFacts: false,
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.result.statusCode !== nextProps.result.statusCode) {
      this.setState({ showFacts: false }, () => setTimeout(() => {
        this.setState({ showFacts: true })
      }, 6000))
    }
    if (nextProps.result.isStarted) {
      setTimeout(() => this.setState({ showCarousel: true }), 2500)
    }
  }

  render() {
    // <div className="device device__laptop">
    return (
      <div className={this.props.config.isMobile ? 'device device__phone' : 'device device__laptop'}>
        {!this.props.result.isStarted &&
          <div>
            <div className="text-center">
              <h1>Page Speed Analyzer</h1>
              <span>Test the performance of your site!</span>
            </div>
            <div className="pa4">
              <ConfigForm config={this.props.config} onSubmit={this.props.onSubmit} />
            </div>
          </div>
        }

        {this.props.result.isStarted &&
          <div className="loading">
            <div className="loading__spinner animated slideInUp">
              <div className="spinner__wrapper">
                <svg className="spinner" width="100%" height="100%" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                  <circle className="path" fill="none" strokeWidth="2" strokeLinecap="round" cx="33" cy="33" r="30"></circle>
                </svg>
              </div>
            </div>
            <div className="loading__status">
              {this.state.showCarousel &&
                <StatusCarousel>
                  {!this.props.result.statusCode &&
                    <StatusPage key="1">
                      <h2 className="text__headline">We will run a series of tests against your site</h2>
                      <div className="text__details">See how fast your current backend stack delivers your site to users. We will compare the results to a version of your site using Baqend Speed Kit</div>
                    </StatusPage>
                  }
                  {this.props.result.statusCode === 101 &&
                    <StatusPage key="101">
                      <h2 className="text__headline">
                        {this.props.result.statusText.replace('...', '')}
                        <span className="loader">
                          <span className="loader__dot">.</span>
                          <span className="loader__dot">.</span>
                          <span className="loader__dot">.</span>
                        </span>
                      </h2>
                      <div className="text__details">Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio, dapibus ac facilisis in, egestas eget quam.</div>
                    </StatusPage>
                  }
                  {this.props.result.statusCode === 100 &&
                    <StatusPage key="100">
                      <h2 className="text__headline">Your Test has been started</h2>
                      <div className="text__details">Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec sed odio dui.</div>
                    </StatusPage>
                  }
                  {this.state.showFacts && funFacts}
                </StatusCarousel>
              }
            </div>
          </div>
        }
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
