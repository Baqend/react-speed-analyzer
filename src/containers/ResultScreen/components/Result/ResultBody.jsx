import React, { Component } from 'react'
import Papercut from '../Papercut/Papercut'
import './ResultBody.css'
import ResultMetrics from './ResultMetrics'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons'
import ResultAction from '../ResultAction/ResultAction'
import ResultWorthiness from '../ResultWorthiness/ResultWorthiness'
import galeriaLogo from '/src/assets/customers/galeria-black.svg'
import decathlonLogo from '/src/assets/customers/decathlon-black.svg'
import carharttLogo from '/src/assets/customers/carhartt-black.svg'
import orsayLogo from '/src/assets/customers/orsay-black.svg'
import snipesLogo from '/src/assets/customers/snipes-black.svg'
import mydaysLogo from '/src/assets/customers/mydays-black.svg'
import jsLogo from '/src/assets/customers/jochen-schweizer-black.svg'
import hsvLogo from '/src/assets/customers/hsv-black.svg'
import easyApothekeLogo from '/src/assets/customers/easyapotheke-black.png'
import justSpicesLogo from '/src/assets/customers/justspices-black.svg'
import defshopLogo from '/src/assets/customers/DefShop_Logo.svg'
import edwinLogo from '/src/assets/customers/edwin-black.png'
import bugabooLogo from '/src/assets/customers/bugaboo-black.png'
import brogleLogo from '/src/assets/customers/brogle-black.png'
import soleboxLogo from '/src/assets/customers/solebox-black.svg'
import weinfuerstLogo from '/src/assets/customers/weinfuerst-black.svg'
import besamexLogo from '/src/assets/customers/besamex-black.png'
import pieperLogo from '/src/assets/customers/parfuemerie-pieper-black.svg'
import pleskLogo from '/src/assets/customers/plesk-black.svg'
import awnLogo from '/src/assets/customers/awn-black.png'
import fussballdatenLogo from '/src/assets/customers/fussballdaten-black.svg'
import pierreCardinLogo from '/src/assets/customers/pierre-cardin-black.png'
import newportLogo from '/src/assets/customers/newport-black.svg'
import baurLogo from '/src/assets/customers/baur-black.svg'
import Barcut from '../BarCut/Barcut'

class ResultBody extends Component {
  constructor(props) {
    super(props)
  }

  createWaterfallLink = () => {
    const {competitorTest, speedKitTest} = this.props.result
    if (import.meta.env.DEV) {
      return `https://${import.meta.env.VITE_REACT_APP_BAQEND}/v1/code/openVideoComparison?ids=${competitorTest.id},${speedKitTest.id}`
    }
    return `/v1/code/openVideoComparison?ids=${competitorTest.id},${speedKitTest.id}`
  }

  renderDetails() {
    return (
      <div className="pt6 result-details">
        <h2 className="mb1">Performance Metrics</h2>
        <div className="purple pb2" style={{ fontWeight: "600"}}>
          <a href={this.createWaterfallLink() } target="_blank">
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
            {scaleSave > 0 && (
              <div className="scale-safe-wrapper" style={{width: scaleSave + '%'}}>
                <Barcut/>
                <div className="scale-save">{competitor - speedKit} MS FASTER</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  renderCustomers() {
    return (
      <div className="flex flex-column text-center pt7 pb6 container">
        <div style={{color: "#333537", fontWeight: "500"}}>JOIN MORE THAN 7,000 WEBSITES THAT LOAD INSTANTLY</div>
        <div className="flex flex-wrap justify-center pt5">
          <div className="customer-wrapper">
            <img className="customer-img" src={galeriaLogo} alt="Galeria logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={decathlonLogo} alt="Decathlon logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={carharttLogo} alt="Carhartt logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={orsayLogo} alt="Orsay logo"/>
          </div>
        </div>
        <div className="flex flex-wrap justify-center">
          <div className="customer-wrapper">
            <img className="customer-img" src={snipesLogo} alt="Snipes logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={mydaysLogo} alt="Mydays logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={jsLogo} alt="Jochen Schweizer logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={defshopLogo} alt="DefShop logo"/>
          </div>
        </div>
        <div className="flex flex-wrap justify-center">
          <div className="customer-wrapper">
            <img className="customer-img" src={hsvLogo} alt="HSV logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={easyApothekeLogo} alt="Easy Apotheke logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={justSpicesLogo} alt="Just Spices logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={edwinLogo} alt="Edwin logo"/>
          </div>
        </div>
        <div className="flex flex-wrap justify-center">
          <div className="customer-wrapper">
            <img className="customer-img" src={bugabooLogo} alt="Bugaboo logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={brogleLogo} alt="Brogle logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={soleboxLogo} alt="Solebox logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={weinfuerstLogo} alt="Weinfuerst logo"/>
          </div>
        </div>
        <div className="flex flex-wrap justify-center">
          <div className="customer-wrapper">
            <img className="customer-img" src={besamexLogo} alt="Besamex logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={pieperLogo} alt="Parmuemerie Pieper logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={pleskLogo} alt="Plesk logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={awnLogo} alt="AWN logo"/>
          </div>
        </div>
        <div className="flex flex-wrap justify-center">
          <div className="customer-wrapper">
            <img className="customer-img" src={fussballdatenLogo} alt="Fussballdaten logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={pierreCardinLogo} alt="Pierre Cardin logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={newportLogo} alt="Newport logo"/>
          </div>
          <div className="customer-wrapper">
            <img className="customer-img" src={baurLogo} alt="Baur logo"/>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const embedded = this.props.embedded
    const showROI = this.props.showROI
    return (
      <div className="flex-grow-1 flex flex-column result-body">
        <Papercut fillColor={"grey"} doRotation={false}/>
        <div className="container result-body-inner">
          {this.renderScale()}
          {this.renderDetails()}
          <ResultAction { ...this.props } toggleModal={this.toggleModal}/>
          {(!embedded && showROI) && <ResultWorthiness
            competitorTest={this.props.competitorTest}
            speedKitTest={this.props.speedKitTest}
            mainMetric={this.props.result.mainMetric}
          />}
          {!embedded && this.renderCustomers()}
        </div>
      </div>
    )
  }
}

export default ResultBody
