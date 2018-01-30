import React, { Component } from 'react'

import './Footer.css'
import LogoWhite from '../../assets/logo_white.png'

class Footer extends Component {
  render() {
    return (
      <footer>
        <div className="info pa2">
          <div className="container">
            <div className="flex justify-between items-center flex-wrap flex-nowrap-l">
              <div className="flex items-center w-100 w-auto-l flex-grow-1 flex-grow-0-l justify-center justify-start-l order-1 order-0-l">
                <img className="mh2" src={LogoWhite} height={32} alt="Logo White" style={{ marginTop: 4 }}/>
                <small>© 2018 Baqend</small>
              </div>
              <div className="flex items-center w-100 w-auto-l flex-grow-1 flex-grow-0-l justify-center justify-start-l order-0 order-1-l mb2 mb0-ns">
                <a className="pa1" href="https://dashboard.baqend.com/privacy">
                  Privacy Policy
                </a>
                <a className="pa1" href="https://dashboard.baqend.com/terms">
                  Terms of Service
                </a>
                <a className="pa1" href="https://dashboard.baqend.com/imprint">
                  Imprint
                </a>
                <a className="pa1" href="/?examples=true">
                  Examples
                </a>
              </div>
            </div>

          </div>
        </div>
      </footer>
    )
  }
}

export default Footer
