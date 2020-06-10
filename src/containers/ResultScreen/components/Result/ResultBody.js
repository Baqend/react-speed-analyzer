import React, { Component } from 'react'
import Papercut from '../Papercut/Papercut'
import './ResultBody.css'
import barCut from 'assets/barCutGrey.svg'
import ResultMetrics from './ResultMetrics'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons'
import ResultAction from '../ResultAction/ResultAction'
import ResultWorthiness from '../ResultWorthiness/ResultWorthiness'
import baurLogo from 'assets/customers/BAUR_Logo.svg'
import decathlonLogo from 'assets/customers/Decathlon_Logo.svg'
import appelrathLogo from 'assets/customers/Appelrath_Logo.svg'
import stylefileLogo from 'assets/customers/Stylefile_Logo.svg'
import empiriecomLogo from 'assets/customers/empiriecom_Logo.svg'
import actianLogo from 'assets/customers/actian_Logo.svg'
import fussballdatenLogo from 'assets/customers/fussballdaten_Logo.svg'
import asklepiosLogo from 'assets/customers/ASKLEPIOS_Logo.svg'
import defshopLogo from 'assets/customers/DefShop_Logo.svg'
import mydaysLogo from 'assets/customers/mydays.svg'
import johnReedLogo from 'assets/customers/JohnReed_Logo.png'
import justSpicesLogo from 'assets/customers/justspices.svg'
import toolImage from 'assets/tool.svg'
import ContactForm from '../../../../components/ContactForm/ContactForm'

class ResultBody extends Component {
  constructor(props) {
    super(props)
  }

  createWaterfallLink = () => {
    const {competitorTest, speedKitTest} = this.props.result
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_TYPE === 'modules') {
      return `https://${process.env.REACT_APP_BAQEND}.app.baqend.com/v1/code/openVideoComparison?ids=${competitorTest.id},${speedKitTest.id}`
    }
    return `/v1/code/publishWaterfalls?id=${competitorTest.id},${speedKitTest.id}`
  }

  renderDetails(showError) {
    return (
      <div className="pt6 result-details">
        <h2 className="mb1">Performance Metrics</h2>
        <div className="purple pb2" style={{ fontWeight: "600"}}>
          <a href={!showError ? this.createWaterfallLink() : ''} target="_blank">
            <FontAwesomeIcon icon={ faLongArrowAltRight } /> WebPageTest Results
          </a>
        </div>
        <ResultMetrics { ...this.props } />
      </div>
    )
  }

  renderScale() {
    const {competitorTest, speedKitTest, mainMetric} = this.props.result
    const competitor = competitorTest.firstView && competitorTest.firstView[mainMetric] ? competitorTest.firstView[mainMetric] : null
    const speedKit = speedKitTest.firstView && speedKitTest.firstView[mainMetric] ? speedKitTest.firstView[mainMetric] : null
    const scaleSave = competitor && speedKit ? (competitor - speedKit) / competitor * 100 : 0

    return (
      <div className="pb3 scale">
        <div className="flex flex-column scale-wrapper">
          <div className="scale-competitor">BEFORE</div>
          <div className="flex flex-row pt1">
            <div className="scale-speedKit" style={{width: 100 - scaleSave + '%'}}>AFTER</div>
            {scaleSave > 0 && <img src={barCut} className="bar-cut-image" alt="bar cut" />}
            {scaleSave > 0 && <div className="scale-save" style={{width: scaleSave + '%'}}>{competitor - speedKit} MS FASTER</div>}
          </div>
        </div>
      </div>
    )
  }

  renderCustomers() {
    return (
      <div className="flex flex-column text-center pt7 pb6 container">
        <div style={{color: "#333537", fontWeight: "500"}}>JOIN MORE THAN 6,000 WEBSITES THAT LOAD INSTANTLY</div>
        <div className="flex flex-wrap justify-center pt5">
          <div className="customer-wrapper">
            <img className="customer-img" src={baurLogo} alt="Baur logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={decathlonLogo} alt="Decathlon logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={appelrathLogo} alt="Appelrath logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={stylefileLogo} alt="Stylefile logo"/>
          </div>
        </div>
        <div className="flex flex-wrap justify-center">
          <div className="customer-wrapper">
            <img className="customer-img" src={empiriecomLogo} alt="Empiriecom logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={actianLogo} alt="Actian logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={fussballdatenLogo} alt="Fussballdaten logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={asklepiosLogo} alt="Asklepios logo"/>
          </div>
        </div>
        <div className="flex flex-wrap justify-center">
          <div className="customer-wrapper">
            <img className="customer-img" src={defshopLogo} alt="DefShop logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={mydaysLogo} alt="MyDays logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" style={{width: "auto", minWidth: "0px"}} src={johnReedLogo} alt="John Reed logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={justSpicesLogo} alt="Just Spices logo"/>
          </div>
        </div>
      </div>
    )
  }

  renderErrorOverlay() {
    return (
      <div className="error-overlay">
        <div className="flex flex-column text-center error-overlay-inner">
          <img className="tool-img" src={toolImage} alt="tool image"/>
          <div className="header pt4">Configuration Required</div>
          <div className="text pt2">Unfortunately, your website cannot be tested with our default test configuration.
            Please request a manual test and our team will be in touch as soon as possible to unlock your performance
            test results.
          </div>
          <ContactForm onlyMail={true}/>
        </div>
        {!this.props.embedded && this.renderCustomers()}
      </div>
    )
  }

  render() {
    const embedded = this.props.embedded
    const {competitorError, speedKitError} = this.props.result
    const showError = competitorError || speedKitError
    return (
      <div className="flex-grow-1 flex flex-column result-body">
        <Papercut fillColor={"grey"} doRotation={false}/>
        {this.props.result.isFinished && (
          <div className="container result-body-inner">
            {!showError && this.renderScale()}
            {this.renderDetails(showError)}
            <ResultAction { ...this.props } toggleModal={this.toggleModal}/>
            {!embedded && !showError && <ResultWorthiness
              competitorTest={this.props.competitorTest}
              speedKitTest={this.props.speedKitTest}
              mainMetric={this.props.result.mainMetric}
            />}
            {!embedded && !showError && this.renderCustomers()}
            {showError && this.renderErrorOverlay()}
          </div>
        )}
      </div>
    )
  }
}

export default ResultBody
