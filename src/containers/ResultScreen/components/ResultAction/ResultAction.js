import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { prepareTest, startTest } from 'actions/test'
import { getObjectKey } from 'helper/utils'
import { calculateAbsolute, calculateServedRequests } from 'helper/resultHelper'
import { formatFileSize } from 'helper/utils'

import WordPressLogo from 'assets/wordpress.png'
import check from 'assets/check.svg'
import cancel from 'assets/cancel.svg'

class ResultAction extends Component {

  restartAnalyzer = async () => {
    const { history } = this.props
    try {
      const urlInfo = await this.props.actions.prepareTest(this.props.config.url)
      history.push('/')
      const testOverview = await this.props.actions.startTest(urlInfo)
      history.push(`/test/${getObjectKey(testOverview.id)}`)
    } catch (e) {}
  }

  getCTAContent = () => {
    console.log(this.props)
    const content = []
    // TTFB improvement
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    if (competitorData.ttfb > speedKitData.ttfb) {
      content.push(`Speed Kit cached your HTML in a CDN, which reduced the time-to-first-byte (TTFB) from ${competitorData.ttfb} ms to ${speedKitData.ttfb} ms.`)
    }

    // images size improvement
    const imageSizeDiff = competitorData.contentSize.images - speedKitData.contentSize.images
    if (imageSizeDiff > 0) {
      content.push(`By optimizing images in size and encoding Speed Kit saved ${formatFileSize(imageSizeDiff)} of data.`)
    }

    // Caching header information
    const servedRate = calculateServedRequests(speedKitData)
    const withCaching = competitorData.hits.withCaching
    const cachingAmount = withCaching ? Math.round((100 / competitorData.requests) * withCaching) : 0
    content.push(`Only ${cachingAmount}% of all resources had correct caching headers. Speed Kit cached ${servedRate}% of them while making sure that they are always up-to-date.`)

    // text size improvement
    const textSizeDiff = competitorData.contentSize.text - speedKitData.contentSize.text
    if (textSizeDiff > 0) {
      content.push(`By Gzipping text resources Speed Kit reduced page weight by  ${formatFileSize(textSizeDiff)}.`)
    }

    // SSL information
    if (!this.props.testOverview.isSecured) {
      content.push('Your website uses HTTP/1.1. With Speed Kit everything was automatically fetched with an optimized HTTP/2 connection.')
    }

    // Speed Index and First Meaningful Paint improvement
    const siImprovement = Math.round((competitorData.speedIndex - speedKitData.speedIndex) / competitorData.speedIndex * 100)
    const fmpImprovement = Math.round((competitorData.firstMeaningfulPaint - speedKitData.firstMeaningfulPaint) / competitorData.firstMeaningfulPaint * 100)
    if (siImprovement > 0 && fmpImprovement > 0) {
      content.push(`Speed Kit improved the Speed Index by ${siImprovement}% and the First Meaningful Paint by ${fmpImprovement}%.`)
    }

    // Offline Mode
    content.push('Without a network, your site displays an error. Speed Kit\'s Service Worker will show users the latest seen version (offline mode).')

    //Bloom Filter
    content.push('Upon repeat visit and navigation Speed Kit would serve all fresh resources from the client cache (Bloom filter-based cache coherence).')

    return content
  }

  // all Tests failed
  renderAllTestsFailed() {
    return (
      <div>
        <div className="text-center pb2 pt2" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Test Runs Failed</h2>
          <span className="faded">An error occurred while running your tests. Please re-run the test and if the problem persists, <a style={{ cursor: 'pointer' }} onClick={this.props.toggleModal}>contact us!</a></span>
        </div>
        <div className="text-center">
          <a className="btn btn-orange btn-ghost ma1" onClick={this.restartAnalyzer}>Rerun Test</a>
        </div>
      </div>
    )
  }

  // Speedkit failed or we are not faster
  renderSpeedKitFailed() {
    return (
      <div>
        <div className="text-center pb2 pt2" style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2>Speed Kit Test Run Failed</h2>
          <span className="faded">It looks like some fine-tuning or configuration is required to measure your site. Please contact our web performance experts to adjust and re-run the test!</span>
        </div>
        <div className="text-center">
          <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
        </div>
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
    const { configMissing, isDisabled, swPath, swPathMatches } = configAnalysis
    const { isSecured } = this.props.testOverview

    return (
      <div style={{ maxWidth: 768, margin: '0 auto' }}>
        <div className="text-center pb2 pt2">
          <h2>Thank you for using Speed Kit</h2>
          <span className="faded">
            The Analyzer detected Speed Kit version {speedKitVersion}. The test therefore compared your website with Speed Kit to
            a version where Speed Kit is not installed. To help you integrating Speed Kit on your website, you can find the status of your installation below.
          </span>
        </div>
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
              <img src={isSecured ? check : cancel} alt="secure status" style={{ height: 30}} />
            </div>
          </div>
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
              <img src={swPathMatches ? check : cancel} alt="service worker status" style={{ height: 30}} />
            </div>
          </div>
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
              <img src={!configMissing && !isDisabled ? check : cancel} alt="config status" style={{ height: 30}} />
            </div>
          </div>
        </div>
        <div className="text-center">
          <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
        </div>
      </div>
    )
  }

  // success
  renderCta() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView
    const absolute = calculateAbsolute(competitorData[this.props.result.mainMetric], speedKitData[this.props.result.mainMetric])
    const ctaContent = this.getCTAContent()

    return (
      <div>
        <div className="text-center pb2 pt2" style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 className="dn db-ns mb0">
            How does Speed Kit made your site <span style={{ color: '#F27354' }}>{absolute}</span> faster?
          </h2>
          <h3 className="dn-ns mb0">
            How does Speed Kit made your site <span style={{ color: '#F27354' }}>{absolute}</span> faster?
          </h3>
          <h4 className="faded mt0 mb0">
            Here are some features Speed Kit applied to your website.
          </h4>
        </div>
        <div className="flex flex-wrap">
          {ctaContent.map((content, index) => (
            <div key={index} className="w-100 w-50-ns mt2 mb2">
              <div className="flex ml2 mr2">
                <div className="w-20 w-10-ns">
                  <img src={ check } alt="speed kit feature" style={{ height: 30}} />
                </div>
                <div className="w-80 w-90-ns">
                  <h4 className="mt0 mb0">{ content }</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <a className="btn btn-orange ma1"
            target="_blank" rel="noopener noreferrer"
            href="https://dashboard.baqend.com/register?appType=speedkit">Sign Up</a>
          <a className="btn btn-orange btn-ghost ma1" onClick={this.props.toggleModal}>Contact Us</a>
        </div>
        <div className="text-center mt1">
          <small>
            <a
              target="_blank" rel="noopener noreferrer"
              href="https://www.baqend.com/speedkit.html?_ga=2.224276178.858004496.1520933148-181229276.1509025941#sk-features">More facts about Speed Kit
            </a>
          </small>
        </div>
      </div>
    )
  }

  render() {
    const { competitorError, speedKitError, competitorTest, testOverview } = this.props.result
    // const speedKitError = this.props.speedKitError
    const isWordPress = competitorTest.isWordPress
    const { isSpeedKitComparison, speedKitVersion, configAnalysis } = testOverview

    if (competitorError) {
      return this.renderAllTestsFailed()
    } else if (!competitorError && speedKitError) {
      return this.renderSpeedKitFailed()
    } else {
      if (isSpeedKitComparison) {
        return this.renderIsSpeedKitCta(speedKitVersion, configAnalysis)
      } else if (isWordPress) {
        return this.renderWordpressCta()
      }
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
