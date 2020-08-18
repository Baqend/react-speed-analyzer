import React, { Component } from 'react'
import PropTypes from 'prop-types'
import renderHTML from 'react-render-html'
import './ResultAction.css'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { prepareTest, startTest } from 'actions/test'
import { getObjectKey } from 'helper/utils'
import { calculateAbsolute } from 'helper/resultHelper'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import {
  categorizeClientCachingFact,
  categorizeCompressionFact, categorizeHTTPCachingFact,
  categorizeIOFact, categorizePWAFact,
  categorizeSSLFact,
  categorizeTtfbFact, categorizeUserPerceivedPerformanceFact
} from "../../../../helper/ctaFacts"

class ResultAction extends Component {

  restartAnalyzer = async () => {
    const { history } = this.props
    try {
      await this.props.actions.prepareTest(this.props.config.url)
      history.push('/')
      const testOverview = await this.props.actions.startTest()
      history.push(`/test/${getObjectKey(testOverview.id)}`)
    } catch (e) {}
  }

  getCTAContent = () => {
    const improvements = []
    const applied = []
    const { isSpeedKitComparison } = this.props.testOverview

    // Request Latency
    const competitorData = this.props.competitorTest.firstView || {}
    const speedKitData = this.props.speedKitTest.firstView || {}
    categorizeTtfbFact(competitorData.ttfb, speedKitData.ttfb, isSpeedKitComparison, applied, improvements)

    // Dummy values intended to ensure cta is rendered in background of error view
    const { contentSize: competitorContentSize = { images: 50001, text: 50001 } } = competitorData
    const { contentSize: speedKitContentSize = { images: 0, text: 0 } } = speedKitData

    // Image Optimization
    categorizeIOFact(competitorContentSize, speedKitContentSize, isSpeedKitComparison, applied, improvements)

    // SSL information
    categorizeSSLFact(this.props.testOverview.puppeteer, isSpeedKitComparison, applied, improvements)

    // Compression
    categorizeCompressionFact(competitorContentSize, speedKitContentSize, isSpeedKitComparison, applied, improvements)

    // HTTP Caching
    categorizeHTTPCachingFact(competitorData, speedKitData, isSpeedKitComparison, applied, improvements)

    // User-Perceived Performance
    categorizeUserPerceivedPerformanceFact(competitorData, speedKitData, isSpeedKitComparison, applied, improvements)

    // Faster Dependencies
    /*
    const thirdPartyDomains = this.props.speedKitTest.thirdPartyDomains
    if (thirdPartyDomains > 0) {
      const dependenciesFact = [
        'Faster Dependencies',
        `You included static resources from <strong>${thirdPartyDomains} external domains</strong> that Speed Kit accelerated.`
      ]
      content.push(dependenciesFact)
    }
    */

    // Client Caching
    categorizeClientCachingFact(isSpeedKitComparison, applied, improvements)

    if ((improvements.length + applied.length) % 2 !== 0) {
      // Progressive Web App
      categorizePWAFact(isSpeedKitComparison, applied, improvements)
    }

    return {improvements, applied}
  }

  // success for wordpress page
  renderWordpressCta() {
    return (
      <div className="flex items-center pb2 pt2" style={{ maxWidth: 768, margin: `0 auto` }}>
        <div className="ph2 dn db-ns wordpress-image"/>
        <div className="ph2">
          <h2 className="mb1 dn db-ns">WordPress too slow?</h2>
          <h2 className="flex items-center justify-center dn-ns tc">
            WordPress too slow?
          </h2>
          <div className="tc tl-ns">
            <span className="faded">One plugin that does it all: Instant response times for WordPress blogs, shops, and landing pages.</span>
          </div>
          <p className="tc tl-ns mt2">
            <a target="_blank" rel="noopener noreferrer" className="btn btn-purple" href="https://wordpress.org/plugins/baqend/">Download Plugin</a>
          </p>
        </div>
      </div>
    )
  }

  renderIsSpeedKitCta(speedKitVersion, configAnalysis) {
    const { configMissing, isDisabled, swPath, swPathMatches } = configAnalysis || {}
    const { isSecured } = this.props.testOverview

    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    const absolute = calculateAbsolute(competitorData[this.props.result.mainMetric], speedKitData[this.props.result.mainMetric])
    const showOptimization = absolute !== '0 ms'

    return (
      <div>
        <div style={{ maxWidth: 768, margin: '0 auto' }}>
          <div className="text-center pb2 pt2">
            <h2>Thank you for using Speed Kit</h2>
            <span className="faded">
              The Analyzer detected Speed Kit version {speedKitVersion}. The test therefore compared your website with Speed Kit to
              a version where Speed Kit is not installed.
            </span>
            {configAnalysis &&
            <span className="faded">To help you integrating Speed Kit on your website, you can find the status of your installation below.
            </span>
            }
          </div>
          {configAnalysis &&
          <div className="flex flex-wrap pb2">
            <div className="flex mt2">
              <div className="w-90">
                <h3 className="mt0 mb0">Secure your website with <strong>SSL</strong></h3>
                <h4 className="faded mt0 mb0">
                  Since Speed Kit is built on Service Workers, it is only available when SSL is turned on.
                  Thereby a encrypted communication for your website is enabled.
                </h4>
              </div>
              <div className="w-10 text-center">
                <FontAwesomeIcon icon={ isSecured ? faCheckCircle: faExclamationCircle }
                  style={{ color: '#12b84f', width: '30px', height: '30px'}}/>
              </div>
            </div>
            {!configAnalysis.configMissing &&
            <div className="flex mt2">
              <div className="w-90">
                <h3 className="mt0 mb0">Host the <strong>Service Worker</strong> script in the correct scope</h3>
                <h4 className="faded mt0 mb0">
                  The path of the Service Worker script specified in your Speed Kit config has to match the path found by the Analyzer.&nbsp;
                  {!swPath && <span>There was no Service Worker found by the Analyzer.</span>}
                  {(!swPathMatches && swPath) &&
                  <span>The detected Service Worker path at <strong>{swPath}</strong> does not match the specified path.</span>
                  }
                </h4>
              </div>
              <div className="w-10 text-center">
                <FontAwesomeIcon icon={ isSecured ? faCheckCircle: faExclamationCircle }
                  style={{ color: '#12b84f', width: '30px', height: '30px'}}/>
              </div>
            </div>
            }
            <div className="flex mt2">
              <div className="w-90">
                <h3 className="mt0 mb0">Provide an enabled <strong>Speed Kit config</strong> on your website</h3>
                <h4 className="faded mt0 mb0">
                  Use the config in your website to enable and configure Speed Kit. It needs to be included into your page.&nbsp;
                  {configMissing && <span>Unfortunately, there was no Speed Kit config found on your page.</span>}
                  {(!configMissing && isDisabled) &&
                  <span>The Speed Kit config found on your page is disabled. Set attribute "disabled" to false to fix this issue.</span>}
                </h4>
              </div>
              <div className="w-10 text-center">
                <FontAwesomeIcon icon={ isSecured ? faCheckCircle: faExclamationCircle }
                  style={{ color: '#12b84f', width: '30px', height: '30px'}}/>
              </div>
            </div>
          </div>
          }
        </div>
        {showOptimization ? (
          <div className="text-center pb2 pt2">
            <h2 className="mb0">
              Obtained Optimization: <span className="purple">{absolute}</span>
            </h2>
          </div>
        ) : (
          <div className="text-center pb2 pt2" style={{maxWidth: 700, margin: '0 auto'}}>
            <h2 className="dn db-ns mb0">
              Optimizations
            </h2>
            <h3 className="dn-ns mb0">
              Optimizations
            </h3>
          </div>
        )}
        {this.renderImprovements()}
        {this.props.toggleModal && (
          <div className="text-center">
            <a className="btn btn-purple btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
          </div>
        )}
      </div>
    )
  }

  renderImprovements() {
    const ctaContent = this.getCTAContent()

    return (
      <div>
        <div className="flex flex-wrap mb2">
          {ctaContent.applied.map((content, index) => (
            <div key={index} className="w-100 w-50-ns mt2 mb2">
              <div className="flex ml2 mr2">
                <div className="w-20 w-10-ns">
                  <FontAwesomeIcon icon={ faCheckCircle } style={{ color: '#12b84f', width: '30px', height: '30px'}}/>
                </div>
                <div className="w-80 w-90-ns">
                  <h4 className="mb0 mt0 fw6">{ content[0] }</h4>
                  <span className="font-small">{ renderHTML(content[1]) }</span>
                </div>
              </div>
            </div>
          ))}
          {ctaContent.improvements.map((content, index) => (
            <div key={index} className="w-100 w-50-ns mt2 mb2">
              <div className="flex ml2 mr2">
                <div className="w-20 w-10-ns">
                  <FontAwesomeIcon icon={ faExclamationCircle } style={{ color: '#ff9d00', width: '30px', height: '30px'}}/>
                </div>
                <div className="w-80 w-90-ns">
                  <h4 className="mb0 mt0 fw6">{ content[0] }</h4>
                  <span className="font-small">{ renderHTML(content[1]) }</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // success
  renderCta() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    const absolute = calculateAbsolute(competitorData[this.props.result.mainMetric], speedKitData[this.props.result.mainMetric])

    return (
      <div>
        <div className="text-center pb3 pt6">
          <h2 className="mb0">
            Speed Kit Accelerates Your Website by <span className="purple">{absolute}</span>
          </h2>
        </div>
        {this.renderImprovements()}
        {this.props.toggleModal && (
          <div className="text-center">
            <a className="btn btn-purple ma1"
              target="_blank" rel="noopener noreferrer"
              href="https://www.baqend.com/speedkit.html?_ga=2.224276178.858004496.1520933148-181229276.1509025941#sk-features">Learn more</a>
            <a className="btn btn-purple btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
          </div>
        )}
      </div>
    )
  }

  render() {
    const { speedKitError, testOverview } = this.props.result
    const isWordPress = testOverview.type === 'wordpress'
    const isPlesk = this.props.result.isPlesk
    const { isSpeedKitComparison, speedKitVersion, configAnalysis } = testOverview

    if (isSpeedKitComparison && !speedKitError) {
      return this.renderIsSpeedKitCta(speedKitVersion, configAnalysis)
    } else if (!isPlesk && isWordPress) {
      return this.renderWordpressCta()
    }

    return this.renderCta()
  }
}

ResultAction.propTypes = {
  toggleModal: PropTypes.func,
  config: PropTypes.object,
}

function mapStateToProps(state) {
  return {
    config: state.config,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ prepareTest, startTest }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultAction)
