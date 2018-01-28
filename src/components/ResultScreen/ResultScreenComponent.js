import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './ResultScreen.css'

import Modal from '../Modal/Modal'

import Result from './Result/Result'
import ResultWorthiness from './ResultWorthiness/ResultWorthiness'
import SpeedKitCarousel from './SpeedKitCarousel/SpeedKitCarousel'
import SpeedKitAnalyzer from './SpeedKitAnalyzer/SpeedKitAnalyzer'
import SpeedKitBanner from './SpeedKitBanner/SpeedKitBanner'

import ConfigForm from '../ConfigForm/ConfigForm'
import ContactForm from '../ContactForm/ContactForm'

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

  renderForm() {
    return (
      <div className="container pa2">
        <div className="mb1">
          <ConfigForm config={this.props.config} showConfig={this.state.showSettings} onSubmit={this.props.onSubmit} />
        </div>
        {!this.state.showSettings &&
          <div className="toggleSettings text-right">
            <span><a onClick={this.toggleSettings}>Show Settings</a></span>
          </div>
        }
      </div>
    )
  }

  renderResults() {
    // const competitorData = this.props.competitorTest.firstView
    // const speedKitData = this.props.speedKitTest.firstView
    const competitorError = this.props.competitorError
    const speedKitError = this.props.speedKitError

    // const competitorData = null
    // const speedKitData = null
    // const competitorError = true
    // const speedKitError = true

    return (
      <div className="flex-grow-1 results" style={{ marginTop: !competitorError ? 80 : 0 }}>
        { !competitorError && (
          <div className="container pa2">
            <div className="box-shadow results__box" style={{ marginTop: '-96px' }}>
              <Result { ...this.props } />
            </div>
          </div>
        )}

        <div className="container pa2 pt2 pb6 animated slideInUp">
          {competitorError && (
            <div className="text-center pb2 pt4" style={{ maxWidth: 768, margin: '0 auto' }}>
              <h2>Ooooops All Tests Failed</h2>
              <strong>It looks like some fine tuning or configuration is required to measure your site. Please contact our web performance experts for further information and assistance!</strong>
            </div>
          )}
          {!competitorError && speedKitError && (
            <div className="text-center pb2 pt2" style={{ maxWidth: 768, margin: '0 auto' }}>
              <h2>Ooooops Speed Kit Failed</h2>
              <strong>It looks like some fine tuning or configuration is required to measure your site. Please contact our web performance experts for further information and assistance!</strong>
            </div>
          )}
          <div className="text-center">
            {!speedKitError && <a href="" className="btn btn-orange ma1">Boost Your Website</a>}
            <a className="btn btn-orange btn-ghost ma1" onClick={this.toggleModal}>Contact Us</a>
          </div>
        </div>

        <div style={{ background: 'white' }}>
          {!speedKitError && !competitorError && (
            <div className="container pa2 pv6">
              <ResultWorthiness
                competitorTest={this.props.competitorTest}
                speedKitTest={this.props.speedKitTest}
                mainMetric={this.props.mainMetric}
              />
            </div>
          )}
          <div className="pv1 ph2">
            <SpeedKitCarousel />
          </div>
          <div className="container pa2 pt6 pb7">
            <SpeedKitAnalyzer />
          </div>
        </div>
        <SpeedKitBanner />
      </div>
    )
  }

  renderContactFormModal() {
    return (
      <Modal show={this.state.showModal} onClose={this.closeModal} onOutsideClick={this.closeModal}>
        <ContactForm onCancel={this.closeModal} />
      </Modal>
    )
  }

  render() {
    return (
      <div className="results__wrapper">
        <div className="flex flex-column">
          {this.renderForm()}
          {this.props.result.isFinished && (
            <div className="flex-grow-1 flex flex-column animated slideInUp" style={{animationDuration: '0.8s'}}>
              {this.renderResults()}
            </div>
          )}
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
