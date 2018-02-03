import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './ResultScreen.css'

import Modal from '../Modal/Modal'

import Result from './Result/Result'
import ResultWorthiness from './ResultWorthiness/ResultWorthiness'
import ResultAction from './ResultAction/ResultAction'

import SpeedKitCarousel from './SpeedKitCarousel/SpeedKitCarousel'
import SpeedKitAnalyzer from './SpeedKitAnalyzer/SpeedKitAnalyzer'
import SpeedKitBanner from './SpeedKitBanner/SpeedKitBanner'

import ConfigForm from '../ConfigForm/ConfigForm'
import ContactForm from '../ContactForm/ContactForm'

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showSettings: true,
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
    // console.log(this.props.competitorTest)
    // const competitorData = null
    // const speedKitData = null
    // const competitorError = true
    // const speedKitError = true

    return (
      <div className="flex-grow-1 results animated slideInUp" style={{ animationDuration: '0.8s' }}>
        { !competitorError && (
          <div className="container pa2">
            <div className="box-shadow results__box" style={{ marginTop: '-96px' }}>
              <Result { ...this.props } />
            </div>
          </div>
        )}

        <div className="container pa2 pt2 pb6 animated slideInUp">
          <ResultAction { ...this.props } toggleModal={this.toggleModal}/>
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
          <div className="container pa2 pv6">
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
    const competitorError = this.props.competitorError
    return (
      <div className="flex results__wrapper pt7">
        <div className="flex-grow-1 flex flex-column">
          {this.renderForm()}
          <div className="flex-grow-1 flex flex-column results" style={{marginTop: this.props.result.isFinished && !competitorError ? 80 : 0, animationDelay: '0.6s', transition: 'margin 0.5s ease' }}>
            {this.props.result.isFinished && this.renderResults()}
          </div>
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
