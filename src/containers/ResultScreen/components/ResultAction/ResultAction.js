import React, { Component } from 'react'
import PropTypes from 'prop-types'
import renderHTML from 'react-render-html'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { prepareTest, startTest } from 'actions/test'
import { getObjectKey } from 'helper/utils'
import { calculateAbsolute } from 'helper/resultHelper'
import { formatFileSize } from 'helper/utils'

import WordPressLogo from 'assets/wordpress.png'
import check from 'assets/check.svg'
import warning from 'assets/warning.svg'
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
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    categorizeTtfbFact(competitorData.ttfb, speedKitData.ttfb, isSpeedKitComparison, applied, improvements);

    // Image Optimization
    const { contentSize: competitorContentSize = null } = competitorData
    const { contentSize: speedKitContentSize = null } = speedKitData
    categorizeIOFact(competitorContentSize, speedKitContentSize, isSpeedKitComparison, applied, improvements)

    // SSL information
    categorizeSSLFact(this.props.testOverview.puppeteer, isSpeedKitComparison, applied, improvements)

    // Compression
    categorizeCompressionFact(competitorContentSize, speedKitContentSize, isSpeedKitComparison, applied, improvements)

    // HTTP Caching
    categorizeHTTPCachingFact(competitorData, speedKitData, isSpeedKitComparison, applied, improvements)


    // Progressive Web App
    categorizePWAFact(isSpeedKitComparison, applied, improvements)

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
      // User-Perceived Performance
      categorizeUserPerceivedPerformanceFact(competitorData, speedKitData, isSpeedKitComparison, applied, improvements)
    }

    return {improvements, applied}
  }

  // all Tests failed
  renderAllTestsFailed(error) {
    const { message = 'An error occurred while running your tests.', status = 500 } = error || {}
    const contactPassage = status === 500 ? 'Please re-run the test and if the problem persists' : 'If you need help with this error'
    return (
      <div>
        <div className="text-center pb2 pt2" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Test Runs Failed</h2>
          <p className="faded">{message}</p>
          <p className="faded">{contactPassage}, <a style={{ cursor: 'pointer' }} onClick={this.props.toggleModal}>feel free to contact us!</a></p>
        </div>
        <div className="text-center">
          <a className="btn btn-orange btn-ghost ma1" onClick={this.restartAnalyzer}>Re-run Test</a>
        </div>
      </div>
    )
  }

  // Speedkit failed or we are not faster
  renderSpeedKitFailed() {
    return (
      <div>
        <div className="text-center pb2 pt2" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Tuning Required</h2>
          <span className="faded">It looks like some fine-tuning or configuration is required to measure your site. Please contact our web performance experts to adjust and re-run the test!</span>
        </div>
        {this.props.toggleModal && (
          <div className="text-center">
            <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
          </div>
        )}
      </div>
    )
  }

  // success for wordpress page
  renderWordpressCta() {
    return (
      <div className="flex items-center pb2 pt2" style={{ maxWidth: 768, margin: '0 auto' }}>
        <div className="ph2 dn db-ns">
          <img className="pa2" height="200" src={WordPressLogo} alt="Wordpress Logo"/>
        </div>
        <div className="ph2">
          <h2 className="mb1 dn db-ns">WordPress too slow?</h2>
          <h2 className="flex items-center justify-center dn-ns tc">
            <img className="mr2" height="50" src={WordPressLogo} alt="Wordpress Logo"/>
            WordPress too slow?
          </h2>
          <div className="tc tl-ns">
            <span className="faded">One plugin that does it all: Instant response times for WordPress blogs, shops, and landing pages.</span>
          </div>
          <p className="tc tl-ns mt2">
            <a target="_blank" rel="noopener noreferrer" className="btn btn-orange" href="https://wordpress.org/plugins/baqend/">Download Plugin</a>
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
                <img src={isSecured ? check : warning} alt="secure status" style={{ height: 30}} />
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
                <img src={swPathMatches ? check : warning} alt="service worker status" style={{ height: 30}} />
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
                <img src={!configMissing && !isDisabled ? check : warning} alt="config status" style={{ height: 30}} />
              </div>
            </div>
          </div>
          }
        </div>
        <div className="text-center pb2 pt2" style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 className="dn db-ns mb0">
            Obtained Optimization: <span style={{ color: '#F27354' }}>{absolute}</span>
          </h2>
          <h3 className="dn-ns mb0">
            Obtained  Optimization: <span style={{ color: '#F27354' }}>{absolute}</span>
          </h3>
        </div>
        {this.renderImprovements()}
        {this.props.toggleModal && (
          <div className="text-center">
            <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
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
                  <img src={ check } alt="speed kit feature" style={{ height: 30}} />
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
                  <img src={ warning } alt="speed kit feature" style={{ height: 30}} />
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
        <div className="text-center pb2 pt2" style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 className="dn db-ns mb0">
            How Speed Kit can Accelerate Your Site by <span style={{ color: '#F27354' }}>{absolute}</span>
          </h2>
          <h3 className="dn-ns mb0">
            How Speed Kit can Accelerate Your Site by <span style={{ color: '#F27354' }}>{absolute}</span>
          </h3>
        </div>
        {this.renderImprovements()}
        {this.props.toggleModal && (
          <div className="text-center">
            <a className="btn btn-orange ma1"
              target="_blank" rel="noopener noreferrer"
              href="https://www.baqend.com/speedkit.html?_ga=2.224276178.858004496.1520933148-181229276.1509025941#sk-features">Learn more</a>
            <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
          </div>
        )}
      </div>
    )
  }

  render() {
    const { competitorError, speedKitError, testOverview } = this.props.result
    // const speedKitError = this.props.speedKitError
    const isWordPress = testOverview.type === 'wordpress'
    const isPlesk = this.props.result.isPlesk
    const { isSpeedKitComparison, speedKitVersion, configAnalysis } = testOverview

    if (isSpeedKitComparison && !speedKitError) {
      return this.renderIsSpeedKitCta(speedKitVersion, configAnalysis)
    } else if (competitorError) {
      return this.renderAllTestsFailed(testOverview.error)
    } else if (!competitorError && speedKitError) {
      return this.renderSpeedKitFailed()
    } else if (!isPlesk && isWordPress){
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
