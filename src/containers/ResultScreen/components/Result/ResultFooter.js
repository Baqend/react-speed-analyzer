import React, { Component } from 'react'
import './ResultFooter.css'
import Papercut from '../Papercut/Papercut'
import instantly from 'assets/instantly.svg'
import onePager from 'assets/SPEED_KIT-Onepager.pdf'
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
import facebookLogo from 'assets/footer/facebook.png'
import githubLogo from 'assets/footer/github.png'
import mediumLogo from 'assets/footer/medium.svg'
import youtubeLogo from 'assets/footer/youtube.png'
import twitterLogo from 'assets/footer/twitter.svg'
import ContactForm from '../../../../components/ContactForm/ContactForm'
import Modal from 'react-modal'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhoneAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import Footer from '../../../../components/Footer/Footer';

class ResultFooter extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showModal: false,
    }
  }

  toggleModal = () => {
    this.setState({ showModal: !this.state.showModal })
  }

  closeModal = () => {
    this.setState({ showModal: false })
  }

  renderContactFormModal() {
    return (
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

  renderCTA() {
    return (
      <div className="flex-grow-1 flex flex-column" style={{background: "linear-gradient(113deg, #1201e8, #e808f2 102%)"}}>
        <Papercut fillColor={"grey"} doRotation={true}/>
        <div className="flex-column text-center cta-wrapper">
          <div className="flex justify-center flex-wrap">
            <h1 className="ma0 cta-header">Ready to Load</h1>
            <img className="ml1 cta-img" src={instantly} alt="Instantly"/>
          </div>
          <h3 className="mt4">Make your website load 1.5 to 4x faster, now.</h3>
          <div className="flex justify-center flex-wrap mt5">
            <span className="btn btn-purple mb2 mr0 mr3-ns" style={{display: "flex", alignItems: "center"}} onClick={this.toggleModal}>
              CONTACT SALES
            </span>
            <a className="btn btn-white mb2" href={onePager} target="_blank">DOWNLOAD ONEPAGER</a>
          </div>
        </div>
      </div>
    )
  }

  renderFooter() {
    return (
      <div className="flex-grow-1 flex flex-column" style={{ backgroundColor: "#333537"}}>
        <Papercut fillColor={"black"} doRotation={false}/>
        <div className="pa3 footer-wrapper">
          <div className="flex justify-center flex-wrap">
            <div className="flex flex-column footer-menu-column pt5">
              <div className="footer-menu-header pb3">Product</div>
              <a className="footer-menu-item mt1 mb1" href="https://www.baqend.com/" target="_blank">Speed Kit</a>
              <a className="footer-menu-item mt1 mb1" href="https://www.baqend.com/how-it-works" target="_blank">How It Works</a>
              <a className="footer-menu-item mt1 mb1" href="https://www.baqend.com/pricing" target="_blank">Pricing</a>
            </div>
            <div className="flex flex-column footer-menu-column pt5">
              <div className="footer-menu-header pb3">Developer</div>
              <a className="footer-menu-item mt1 mb1" href="https://dashboard.baqend.com/login" target="_blank">Sign In</a>
              <a className="footer-menu-item mt1 mb1" href="https://dashboard.baqend.com/register" target="_blank">Sign Up</a>
              <a className="footer-menu-item mt1 mb1" href="https://speedkit.zendesk.com/hc/en-us/" target="_blank">Documentation</a>
            </div>
            <div className="flex flex-column footer-menu-column pt5">
              <div className="footer-menu-header pb3">Company</div>
              <a className="footer-menu-item mt1 mb1" href="https://www.baqend.com/about" target="_blank">Who We Are</a>
              <a className="footer-menu-item mt1 mb1" href="https://medium.baqend.com/" target="_blank">Baqend Blog</a>
              <a className="footer-menu-item mt1 mb1" href="https://research.baqend.com/" target="_blank">Bachelor/Master Theses</a>
              <a className="footer-menu-item mt1 mb1" href="https://www.baqend.com/presentations.html" target="_blank">Videos & Presentations</a>
              <a className="footer-menu-item mt1 mb1" href="https://www.baqend.com/jobs.html" target="_blank">Jobs</a>
            </div>
            <div className="flex flex-column footer-menu-column pt5">
              <div className="footer-menu-header pb3">Contact</div>
              <span className="footer-menu-item">
                Baqend GmbH<br/>
                Stresemannstr. 23<br/>
                22769 Hamburg<br/>
                Germany
              </span>
              <a className="footer-menu-item mt2" href="mailto:support@baqend.com">
                <FontAwesomeIcon icon={ faEnvelope } className="mr1"/>
                support@baqend.com
              </a>
              <a className="footer-menu-item mt2" href="tel:+494060940539">
                <FontAwesomeIcon icon={ faPhoneAlt } className="mr1"/>
                +49 40 60940539
              </a>
            </div>
          </div>
          <div className="flex flex-wrap justify-center mt5">
            <div className="flex justify-center flex-column footer-line-wrapper">
              <div className="footer-line"/>
            </div>
            <div className="flex footer-icon-wrapper">
              <a href="https://www.facebook.com/baqend" className="inline-block w-25 footer-icon">
                <img src={facebookLogo} alt="Facebook logo" className="inline-block w-100"/>
              </a>
              <a href="https://github.com/Baqend" className="inline-block w-25 footer-icon">
                <img src={githubLogo} alt="Github logo" className="inline-block w-100"/>
              </a>
              <a href="https://medium.baqend.com/" className="inline-block w-25 footer-icon">
                <img src={mediumLogo} alt="Medium logo" className="inline-block w-100"/>
              </a>
              <a href="https://www.youtube.com/channel/UCsImg6Ts8UEp6-7LE9CP2-Q" className="inline-block w-25 footer-icon">
                <img src={youtubeLogo} alt="Youtube logo" className="inline-block w-100"/>
              </a>
              <a href="https://twitter.com/baqendcom" className="inline-block w-25 footer-icon">
                <img src={twitterLogo} alt="Twitter logo" className="inline-block w-100"/>
              </a>
            </div>
            <div className="flex justify-center flex-column footer-line-wrapper">
              <div className="footer-line"/>
            </div>
          </div>
        </div>
        <Footer isResultPage={true}/>
      </div>
    )
  }

  render() {
    return (
      <div className="result-footer">
        {this.renderCustomers()}
        {this.renderCTA()}
        {this.renderContactFormModal()}
        {this.renderFooter()}
      </div>
    )
  }
}

export default ResultFooter
