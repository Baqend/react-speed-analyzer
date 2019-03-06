import React, { Component } from 'react'

import './SpeedKitAnalyzer.css'

import speedKitVideo from 'assets/speedkitvideo.png'

import Modal from 'react-modal'

class SpeedKitBanner extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showModal: false
    }
  }

  openModal = () => {
    this.setState({
      showModal: true
    })
  }

  closeModal = () => {
    this.setState({
      showModal: false
    })
  }

  render() {
    return (
      <div className="pt0-ns">
        <div className="pv2 pv4-ns flex flex-wrap flex-nowrap-ns items-center" style={{ margin: -8 }}>
          <div className="w-100 pa1 w-60-ns tc tl-ns mb4 mb0-ns">
            <h2 className="mt0">Speed Kit Explained.</h2>
            <p className="faded" style={{ maxWidth: 500 }}>
              Watch this short video, to learn how Speed Kit can help you make fast page loads your competitive advantage.
            </p>
            <a className="btn mt2 btn-orange btn-ghost" href="https://medium.baqend.com/the-technology-behind-fast-websites-2638196fa60a#d876" target="_blank" rel="noopener noreferrer">In-Depth Article</a>
          </div>
          <div className="w-100 pa1 w-40-ns">
            <div className="video__wrapper auto">
              <img className="db" src={speedKitVideo} alt="Speed Kit Video" width="100%" style={{ borderRadius: 2 }}/>
              <div className="video__wrapper-play" onClick={this.openModal}>►</div>
            </div>
          </div>
        </div>
        {/*}<Modal show={true} onClose={this.closeModal} onOutsideClick={this.closeModal}>
          <iframe src="http://www.youtube.com/embed/lPGSFpiKBpg?autoplay=1" width="960" height="447" frameborder="0" allowfullscreen></iframe>
        </Modal>*/}

        <Modal
          isOpen={this.state.showModal}
          closeTimeoutMS={150}
          className="modal"
          overlayClassName="overlay"
        >
          <a className="close" onClick={this.closeModal}>x</a>
          <div className="dialog video" style={{ padding: 0}}>
            <div className="video-container">
              <iframe title="Baqend Youtube Video" src="https://www.youtube.com/embed/lPGSFpiKBpg?autoplay=1" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
            </div>
          </div>
        </Modal>

      </div>
    )
  }
}

export default SpeedKitBanner
