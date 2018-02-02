import React, { Component } from 'react'
import { connect } from 'react-redux'

import './Footer.css'
import LogoWhite from '../../assets/logo_white.png'

class Footer extends Component {
  getRandomExample = (e) => {
    e.preventDefault()
    const ids = this.props.examples.map(example => example.id)
    alert(ids[Math.floor(Math.random() * ids.length)])
  }

  render() {
    return (
      <footer>
        <div className="info">
          <div className="container pa2">
            <div className="flex justify-between items-center flex-wrap flex-nowrap-l">
              <div className="flex items-center w-100 w-auto-l flex-grow-1 flex-grow-0-l justify-center justify-start-l order-1 order-0-l">
                <img className="mr2" src={LogoWhite} height={32} alt="Logo White" style={{ marginTop: 4 }}/>
                <small style={{ whiteSpace: 'nowrap' }}>© 2018 Baqend</small>
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
                <a className="pa1" href="" onClick={this.getRandomExample}>
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

function mapStateToProps(state) {
  return {
    examples: state.examples,
  }
}

export default connect(mapStateToProps, null)(Footer)
