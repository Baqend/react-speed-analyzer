import React, { Component } from "react";
import "./ResultFooter.css";
import instantly from "assets/instantly.svg";
import onePager from "assets/SPEED_KIT-Onepager.pdf";
import facebookLogo from "assets/footer/facebook.png";
import githubLogo from "assets/footer/github.png";
import mediumLogo from "assets/footer/medium.svg";
import youtubeLogo from "assets/footer/youtube.png";
import twitterLogo from "assets/footer/twitter.svg";
import ContactForm from "../../../../components/ContactForm/ContactForm";
import logo from "assets/speed-kit-textlogo-blue-black.svg";
import Modal from "react-modal";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhoneAlt, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import Footer from "../../../../components/Footer/Footer";

class ResultFooter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
    };
  }

  toggleModal = () => {
    this.setState({ showModal: !this.state.showModal });
  };

  closeModal = () => {
    this.setState({ showModal: false });
  };

  renderContactFormModal() {
    return (
      <Modal
        isOpen={this.state.showModal}
        onRequestClose={this.closeModal}
        closeTimeoutMS={150}
        className="modal"
        overlayClassName="overlay"
      >
        <a className="close" onClick={this.closeModal}>
          x
        </a>
        <div className="dialog">
          <ContactForm onlyMail={false} onCancel={this.closeModal} />
        </div>
      </Modal>
    );
  }

  renderCTA() {
    return (
      <div className=" blue cta alignCenter">
        <div className="flex-column text-center  alignCenter">
          <div className="flex justify-center flex-wrap">
            <h1 className="ma0 cta-header">Ready to Load Instantly?</h1>
          </div>
          <h3 className="mt4 subText">
            Make your website load 1.5 to 4x faster, now.
          </h3>
          <div className="flex justify-center flex-wrap mt5">
            <span
              className="btn btn-white filledWhite mb2 mr0 mr3-ns"
              onClick={this.toggleModal}
            >
              Contact Sales
            </span>
            <a
              className="btn btn-white mb2 "
              href={onePager}
              target="_blank"
              rel="noreferrer"
            >
              Download Onepager
            </a>
          </div>
        </div>
      </div>
    );
  }

  renderFooter() {
    return (
      <div class="footer-wrapper">
        <div class="footer-content">
          <div class="column logoCol">
            <p class="pVonLogo">
              <img src={logo} class="logowirklich"></img>
            </p>
            <div class="content-wrapper spacebetween">
              <p class="marginFree ">
                Make your website load instantly <br /> and stop losing
                customers.
              </p>
              <p class="marginFree">© 2022 Baqend GmbH</p>
            </div>
          </div>
          <div class="column">
            <p class="heading">Product</p>
            <div class="content-wrapper">
              <a href="https://speedkit.com/how-it-works">Features</a>
              <a href="https://speedkit.com/pricing">Pricing</a>
              <a href="https://speedkit.com/cases">Case Studies</a>
              <a href="https://dashboard.speedkit.com/">Sign In</a>
            </div>
          </div>
          <div class="column">
            <p class="heading">Company</p>
            <div class="content-wrapper">
              <a href="https://speedkit.com/about">About Us</a>
              <a href="https://speedkit.com/careers">Careers</a>
              <a href="https://research.baqend.com/">Student Theses</a>
              <a href="https://speedkit.com/imprint">Imprint</a>
            </div>
          </div>
          <div class="column">
            <p class="heading">Resources</p>
            <div class="content-wrapper">
              <a href="https://help.speed-kit.com/">Documentation</a>
              <a href="https://speedkit.com/publications/">Publications</a>
              <a href="https://medium.baqend.com/">Baqend Blog</a>
              <a href="https://speedkit.com/privacy">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="result-footer">
        {this.renderCTA()}
        {this.renderContactFormModal()}
        {this.renderFooter()}
      </div>
    );
  }
}

export default ResultFooter;
