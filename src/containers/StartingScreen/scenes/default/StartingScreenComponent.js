import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Spinner from 'components/Spinner'
import ConfigForm from 'components/ConfigForm/ConfigForm'

import Devices from '../../components/DeviceContainer/DeviceContainer'
import PageSpeedInsights from '../../components/PageSpeedInsights/PageSpeedInsights'
import Carousel, {
  renderDefaultPage,
  renderIsInQueuePage,
  renderHasStartedPage,
  renderFactsPages,
} from '../../components/StatusCarousel'

const dots = (
  <span className="loader">
    <span className="loader__dot">.</span>
    <span className="loader__dot">.</span>
    <span className="loader__dot">.</span>
  </span>
)

class StartingScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showCarousel: false,
      showFacts: false,
      showAdvancedConfig: props.showAdvancedConfig,
    }
  }

  onToggleAdvancedConfig = (showAdvancedConfig) => {
    this.setState({ showAdvancedConfig })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.result.statusCode !== nextProps.result.statusCode) {
      clearTimeout(this.showFactsTimeout)
      this.setState({ showFacts: false }, () => {
        this.showFactsTimeout = setTimeout(() => {
          this.setState({ showFacts: true })
        }, 10000)
      })
    }
    if (!this.state.showCarousel && nextProps.result.isStarted) {
      const timeout = window.innerWidth <= 997 ? 500 : 2500
      setTimeout(() => this.setState({ showCarousel: true }), timeout)
    }
  }

  renderForm() {
    return (
      <div className="flex-grow-1 flex flex-column justify-center" style={{ overflow: 'hidden' }}>
        <div className="text-center flex-grow-1 flex flex-column justify-end">
          <h1 className="mv2">Page Speed Analyzer</h1>
        </div>
        <div className="mt4 flex-grow-1 flex flex-column">
          <ConfigForm
            config={this.props.config}
            showConfig={true}
            showAdvancedConfig={this.state.showAdvancedConfig}
            onToggleAdvancedConfig={this.onToggleAdvancedConfig}
            onSubmit={this.props.onSubmit}
          />
        </div>
      </div>
    )
  }

  renderSpinner(statusMessage) {
    return (
      <div className="flex flex-column justify-center items-center" style={{ overflow: 'hidden' }}>
        <div className="spinner__wrapper animated slideInUp">
          <Spinner />
        </div>
        <PageSpeedInsights testOverview={this.props.result.testOverview} />
      </div>
    )
  }

  renderCarousel(statusMessage) {
    const pageSpeedInsights = this.props.result.testOverview && this.props.result.testOverview.psiDomains
    const message = (
      <div className="dn db-ns" style={{ marginTop: 16 }}>{statusMessage}</div>
    )
    return (
      <Carousel message={message}>
        {(!this.props.result.statusCode || !pageSpeedInsights) && renderDefaultPage()}
        {pageSpeedInsights && this.props.result.statusCode === 101 && renderIsInQueuePage(this.props.result.statusText)}
        {pageSpeedInsights && this.props.result.statusCode === 100 && renderHasStartedPage()}
        {pageSpeedInsights && this.state.showFacts && renderFactsPages}
      </Carousel>
    )
  }

  render() {
    const statusMessage = (
      <small className="faded">
        {this.props.result.statusCode === 100 && 'Your Test has been started'}
        {this.props.result.statusCode === 101 && this.props.result.statusText.replace('...', '')}
        {dots}
      </small>
    )

    return (
      <div className="loading-screen flex-column flex-grow-1 flex items-center">
        <Devices
          showDevice={!this.state.showAdvancedConfig}
          isMobile={this.props.config.isMobile}
          showRight={this.props.result.isStarted}
          backgroundImage={this.props.result.testOverview.psiScreenshot}
          left={
            <div className="left">
              {this.props.result.isStarted ? this.renderSpinner(statusMessage) : this.renderForm()}
            </div>
          }
          right={
            <div className="right">
              {this.state.showCarousel ? this.renderCarousel(statusMessage): null}
            </div>
          }
        />
        {(this.props.result.statusCode === 100 || this.props.result.statusCode === 101) && (
          <div className="statusMessage animated fadeInDown tc">
            {statusMessage}
          </div>
        )}
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
