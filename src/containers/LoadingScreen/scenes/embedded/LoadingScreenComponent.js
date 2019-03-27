import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './LoadingScreenComponent.css'

import Spinner from 'components/Spinner'
import DeviceContainer from 'components/DeviceContainer/DeviceContainer'
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

  componentDidUpdate(prevProps, prevState) {
    const nextProps = this.props

    if (prevProps.result.statusCode !== nextProps.result.statusCode) {
      clearTimeout(this.showFactsTimeout)
      this.setState({ showFacts: false }, () => {
        this.showFactsTimeout = setTimeout(() => {
          this.setState({ showFacts: true })
        }, 10000)
      })
    }
    if (!prevState.showCarousel && nextProps.result.isStarted) {
      const timeout = window.innerWidth <= 997 ? 500 : 2500
      setTimeout(() => this.setState({ showCarousel: true }), timeout)
    }
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
    const { statusCode, statusText } = this.props.result
    const pageSpeedInsights = this.props.result.testOverview && this.props.result.testOverview.psiDomains
    const message = <div className="dn db-ns" style={{ marginTop: 16 }}>{statusMessage}</div>
    return (
      <Carousel message={message}>
        {(!statusCode || !pageSpeedInsights) && statusCode !== 101 && statusCode !== 100 && renderDefaultPage()}
        {statusCode === 101 && renderIsInQueuePage(statusText)}
        {statusCode === 100 && renderHasStartedPage()}
        {this.state.showFacts && renderFactsPages}
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
        <DeviceContainer
          showDevice={false}
          mobile={false}
          showRight={true}
          backgroundImage={null}
          left={
            <div className="left">
              {this.renderSpinner(statusMessage)}
            </div>
          }
          right={
            <div className="right">
              {this.state.showCarousel ? this.renderCarousel(statusMessage): null}
            </div>
          }
        />
      </div>
    )
  }
}

StartingScreenComponent.propTypes = {
  config: PropTypes.object.isRequired,
  // onSubmit: PropTypes.func.isRequired,
}

export default StartingScreenComponent
