import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './ResultScreen.css'

// import Modal from '../Modal/Modal'
import Modal from 'react-modal'

import Result from '../../components/Result/Result'
import ResultWorthiness from '../../components/ResultWorthiness/ResultWorthiness'
import ResultAction from '../../components/ResultAction/ResultAction'

import SpeedKitCarousel from '../../components/SpeedKitCarousel/SpeedKitCarousel'
import SpeedKitAnalyzer from '../../components/SpeedKitAnalyzer/SpeedKitAnalyzer'
import SpeedKitBanner from '../../components/SpeedKitBanner/SpeedKitBanner'

import ConfigForm from 'components/ConfigForm/ConfigForm'
import ContactForm from 'components/ContactForm/ContactForm'

import rocket from 'assets/img/rocket-outline-white.png'

import {calculateFactor, isSpeedKitInstalledCorrectly} from "../../../../helper/resultHelper"

Modal.setAppElement('#speed-kit-analyzer')

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: props.showDetails,
      showConfig: props.showConfig,
      showAdvancedConfig: props.showAdvancedConfig,
      showModal: false,
      isIFrame: props.isIFrame,
    }
  }

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  toggleConfig = () => {
    this.setState({ showConfig: !this.state.showConfig })
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
          <ConfigForm
            config={this.props.config}
            showConfig={this.state.showConfig}
            showAdvancedConfig={this.state.showAdvancedConfig}
            onToggleAdvancedConfig={this.props.onToggleAdvancedConfig}
            onSubmit={this.props.onSubmit}
          />
        </div>
      </div>
    )
  }

  renderResults() {
    const { competitorError, speedKitError, mainMetric } = this.props.result
    const { isSpeedKitComparison } = this.props.testOverview

    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    return (
      <div className="flex-grow-1 results animated slideInUp" style={{ animationDuration: '0.5s' }}>
        { !competitorError && (
          <div className="container pv2 pa2-ns">
            <div className="box-shadow results__box" style={{ marginTop: '-96px' }}>
              <Result { ...this.props } />
            </div>
          </div>
        )}

        <div className="container pa2 pt0 pt2-ns pb4 pb6-ns animated slideInUp">
          <ResultAction { ...this.props } toggleModal={this.toggleModal}/>
        </div>

        <div className="pv4 pv7-ns" style={{ background: 'white' }}>
          {!speedKitError && !competitorError && calculateFactor(competitorData[mainMetric], speedKitData[mainMetric]) > 1 && (
            <div className="container ph2 pb2 pb7-ns">
              <ResultWorthiness
                competitorTest={this.props.competitorTest}
                speedKitTest={this.props.speedKitTest}
                mainMetric={this.props.result.mainMetric}
              />
            </div>
          )}
          <div className="pv1 ph2">
            <SpeedKitCarousel />
          </div>
        </div>

        { !this.state.isIFrame && !isSpeedKitComparison && [
          <div key="speedKitAnalyzerInfo" className="pv4 pv7-ns">
            <div className="container ph4">
              <SpeedKitAnalyzer />
            </div>
          </div>,
          <SpeedKitBanner key="speedKitBanner"/>
        ]}
      </div>
    )
  }

  renderContactFormModal() {
    return (
      // <Modal show={this.state.showModal} onClose={this.closeModal} onOutsideClick={this.closeModal}>
      //   <ContactForm onCancel={this.closeModal} />
      // </Modal>
      <Modal
        isOpen={this.state.showModal}
        onRequestClose={this.closeModal}
        closeTimeoutMS={150}
        className="modal"
        overlayClassName="overlay"
      >
        <a className="close" onClick={this.closeModal}>x</a>
        <div className="dialog">
          <ContactForm onCancel={this.closeModal} />
        </div>
      </Modal>
    )
  }

  render() {
    const { competitorError, testOverview } = this.props.result
    const { isSpeedKitComparison, speedKitVersion, configAnalysis } = testOverview

    return (
      <div className="flex results__wrapper pt7">
        <div className="flex-grow-1 flex flex-column" style={{ overflow: 'hidden' }}>
          {this.renderForm()}
          {isSpeedKitComparison && (
            <div className="container text-center" style={{ padding: '0px 16px 16px 16px' }}>
              {isSpeedKitInstalledCorrectly(configAnalysis) ? (
                <div className="flex justify-center" style={{ alignItems: 'center' }}>
                  <h3>You are using Speed Kit {speedKitVersion}</h3>
                  <img src={rocket} style={{paddingLeft: '8px', height: 30}} />
                </div>
              ) : (
                `Thank you for installing Speed Kit, the configuration is not done yet. Please see below for more information.`
              )}
            </div>
          )}
          <div className="flex-grow-1 flex flex-column results" style={{marginTop: competitorError ? 0 : 80, animationDelay: '0.6s', transition: 'margin 0.5s ease' }}>
            {this.props.result.isFinished && this.renderResults()}
          </div>
        </div>
        {this.renderContactFormModal()}
      </div>
    )
  }
}

ResultScreenComponent.propTypes = {
  // mainMetric: PropTypes.string,
  // speedKitError: PropTypes.bool.isRequired,
  onToggleAdvancedConfig: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default ResultScreenComponent
