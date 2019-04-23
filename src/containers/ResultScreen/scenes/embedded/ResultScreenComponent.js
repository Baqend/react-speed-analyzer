import React, { Component } from 'react'

import styles from './ResultScreen.css'

import ConfigForm from 'components/ConfigForm/ConfigForm'

import Result from 'containers/ResultScreen/components/Result/Result'
import ResultAction from '../../components/ResultAction/ResultAction'

import rocket from 'assets/img/rocket-outline-white.png'

import {isSpeedKitInstalledCorrectly} from "../../../../helper/resultHelper"

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: props.showDetails,
      showConfig: props.showConfig,
      showAdvancedConfig: props.showAdvancedConfig,
      isIFrame: props.isIFrame,
    }
  }

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  toggleConfig = () => {
    this.setState({ showConfig: !this.state.showConfig })
  }

  renderForm() {
    return (
      <div className="container pa2">
        <div className="mb1">
          <ConfigForm
            config={this.props.config}
            showConfig={this.state.showConfig}
            showAdvancedConfig={this.state.showAdvancedConfig}
            onSubmit={this.props.onSubmit}
          />
        </div>
      </div>
    )
  }

  renderError() {
    console.log('Render error');
    return (
      <div className={`flex-grow-1 ${styles.results}`}>
        <div className="container pa2 pt0 pt2-ns pb4 pb6-ns text-center">
          The requested test result is no longer available. <br/> Please start a new test to get another result.
        </div>
      </div>
    )
  }

  renderResults() {
    const { competitorError } = this.props.result

    return (
      <div className={`flex-grow-1 ${styles.results}`}>
        <div className="container pv2 pa2-ns">
          <div className="box-shadow results__box" style={{ marginTop: '-96px' }}>
            {!competitorError && (
              <Result { ...this.props } />
            )}
          </div>
        </div>

        <div className="container pa2 pt0 pt2-ns pb4 pb6-ns animated slideInUp">
          <ResultAction { ...this.props }/>
        </div>
      </div>
    )
  }

  render() {
    const { competitorError, testOverview } = this.props.result
    const { isSpeedKitComparison, speedKitVersion, configAnalysis } = testOverview

    return (
      <div className="flex results__wrapper pt7">
        <div className="flex-grow-1 flex flex-column">
          {this.props.showInput && this.renderForm()}
          { isSpeedKitComparison && (
            <div className="container text-center" style={{ padding: '0px 16px 16px 16px' }}>
              <h3>
                { isSpeedKitInstalledCorrectly(configAnalysis) ? (
                  <div className="flex justify-center" style={{ alignItems: 'center' }}>
                    <h3>You are using Speed Kit {speedKitVersion}</h3>
                    <img src={rocket} style={{paddingLeft: '8px', height: 30}} />
                  </div>
                ) : (
                  `Thank you for installing Speed Kit, the configuration is not done yet. Please see below for more information.`
                ) }
              </h3>
            </div>
          )}
          <div className="flex-grow-1 flex flex-column results" style={{marginTop: competitorError ? 0 : 80, animationDelay: '0.6s', transition: 'margin 0.5s ease' }}>
            {this.props.result.isFinished && (
              Object.entries(testOverview).length === 0 ? this.renderError() : this.renderResults())
            }
          </div>
        </div>
      </div>
    )
  }
}

ResultScreenComponent.propTypes = {
  // mainMetric: PropTypes.string,
  // speedKitError: PropTypes.bool.isRequired,
  // onSubmit: PropTypes.func.isRequired,
}

export default ResultScreenComponent
