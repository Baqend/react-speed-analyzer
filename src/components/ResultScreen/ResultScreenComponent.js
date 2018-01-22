import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Collapse from 'react-css-collapse'

import './ResultScreen.css'

import Modal from '../Modal/Modal'

import Result from './Result/Result'
import ResultWorthiness from './ResultWorthiness/ResultWorthiness'

import ConfigForm from '../ConfigForm/ConfigForm'
import Carousel from '../Carousel/Carousel'

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showSettings: false,
      showDetails: false,
      showModal: false,
    }
  }

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  toggleSettings = () => {
    this.setState({ showSettings: !this.state.showSettings })
  }

  toggleModal = () => {
    this.setState({ showModal: !this.state.showModal })
  }

  closeModal = () => {
    this.setState({ showModal: false })
  }

  renderBanner() {
    return (
      <div className="banner">
        <div className="container ph2 pv6">
          <div className="flex items-center">
            <div className="w-50 text-right pa2">
              <h2 className="ma1">Try Baqend Speed Kit Today!</h2>
              Make your websites load instantly
            </div>
            <div className="w-50 pa2 text-left">
              <a
                href="https://www.baqend.com/speedkit.html?_ga=2.235057797.527125052.1516095583-312811701.1516095583"
                className="btn btn-white ma1">
                 Learn More
              </a>
              <a
                href="https://dashboard.baqend.com/register?appType=speedkit&_ga=2.230289688.527125052.1516095583-312811701.1516095583"
                className="btn btn-orange ma1">
                Get Started for Free
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderContactFormModal() {
    return (
      <Modal show={this.state.showModal} onClose={this.closeModal} onOutsideClick={this.closeModal}>
        Contact Form yoooooo
      </Modal>
    )
  }

  render() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    return (
      <div className="flex flex-column results__wrapper animated2 slideInUp2" style={{animationDuration: '0.8s'}}>
        <div className="container pa2 pb7">
          <div className="mb1">
            <ConfigForm config={this.props.config} showConfig={this.state.showSettings} onSubmit={this.props.onSubmit} />
          </div>
          {!this.state.showSettings &&
            <div className="toggleSettings text-right">
              <span><a onClick={this.toggleSettings}>Show Settings</a></span>
            </div>
          }
        </div>
        <div className="flex-grow-1 results">
          <div className="container pa2">
            <div className="box-shadow results__box" style={{ marginTop: '-96px' }}>
              { competitorData && speedKitData && <Result { ...this.props } /> }
            </div>
          </div>

          <div className="container pa2 pb6">
            <div className="text-center pb3">
              <a href="" className="btn btn-orange ma1">Boost Your Website</a>
              <a className="btn btn-orange btn-ghost ma1" onClick={this.toggleModal}>Contact Us</a>
            </div>
          </div>

          <div style={{ background: 'white' }}>

            <div className="container pa2 pv6">
              { competitorData && speedKitData && (
                <ResultWorthiness
                  competitorTest={this.props.competitorTest}
                  speedKitTest={this.props.speedKitTest}
                  mainMetric={this.props.mainMetric}
                />
              )}
            </div>

            <div className="pv6 ph2">
              <Carousel showFirstPool={true} animationDuration={'200s'} />
              <Carousel showFirstPool={true} animationDuration={'250s'} animationDelay={'-30s'}/>
              <div className="text-center" style={{ fontSize: '12px' }}>Performance tests to illustrate Speed Kit's potential. Click to learn more</div>
            </div>

            <div className="container pa2 pv6 text-center">
              <h1>About the Page Speed Analyzer</h1>
              <p>The page speed analyzer gives you an impression of how Baqend Speed Kit influences the performance of your website. To this end, the analyzer runs a series of tests against your website and reports how your current backend stack delivers your website compared to a version using Speed Kit. The result on the right simply shows measurements for your site with an embedded Service Worker containing Speed Kit's caching logic.</p>
            </div>

          </div>

          {this.renderBanner()}
        </div>
        {this.renderContactFormModal()}
      </div>
    )
  }
}

ResultScreenComponent.propTypes = {
  mainMetric: PropTypes.string,
  speedKitError: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default ResultScreenComponent
