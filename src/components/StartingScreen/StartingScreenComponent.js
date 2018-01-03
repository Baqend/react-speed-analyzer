import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ConfigForm from './ConfigForm/ConfigForm'
import { StatusCarousel, StatusPage } from './StatusCarousel/StatusCarousel'

class StartingScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      status: 0,
    }
  }

  componentDidMount() {
    setTimeout(() => this.setState({ showCarousel: true }), 2000)
    setInterval(() => {
      if (this.state.status === 0) {
        this.setState({ status: 1 })
      } else {
        this.setState({ status: 0 })
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
                {this.state.status === 0 && [
                  <StatusPage key="1">
                    <h2 className="text__headline">Status 0 We are running a series of tests against your site</h2>
                    <div className="text__details">See how fast your current backend stack delivers your site to users. We will compare the results to a version of your site using Baqend Speed Kit</div>
                  </StatusPage>
                ]}
                {this.state.status === 1 && [
                  <StatusPage key="2">
                    <h2 className="text__headline">Status 1 Malesuada Cursus Sem Ultricies</h2>
                    <div className="text__details">Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec sed odio dui.</div>
                    <div className="text_details">Donec sed odio dui!</div>
                  </StatusPage>,
                  <StatusPage key="3">
                    <h2 className="text__headline">Sem Aenean Fringilla Sollicitudin Tortor</h2>
                    <div className="text__details">Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio, dapibus ac facilisis in, egestas eget quam.</div>
                  </StatusPage>,
                  <StatusPage key="4">
                    <h2 className="text__headline">Vestibulum Tristique Vulputate Dapibus Elit</h2>
                    <div className="text__details">Nulla vitae elit libero, a pharetra augue. Curabitur blandit tempus porttitor.</div>
                  </StatusPage>
                ]}
              </StatusCarousel>
            }
          </div>
        </div>
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
