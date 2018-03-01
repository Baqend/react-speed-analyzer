import React, { Component } from 'react'

import { connect } from 'react-redux'

import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'

import './Footer.css'
import LogoWhite from '../../assets/logo_white.png'

class Footer extends Component {
  getRandomExample = (e) => {
    e.preventDefault()
    const { history } = this.props
    const ids = this.props.examples.map(example => example.id)
    const randomId = ids[Math.floor(Math.random() * ids.length)]
    history.push(`/test/${randomId}/result`)
  }

  render() {
    return (
      <footer>
        <div className="info">
          <div className="container pa2">
            <div className="flex justify-start items-center flex-wrap flex-nowrap-l">
              <div className="flex items-center w-100 w-auto-l flex-grow-1 flex-grow-0-l justify-center justify-start-l order-1 order-0-l">
                <Link to="/" style={{ marginTop: 4, display: 'inline-grid' }}>
                  <img className="mr2" src={LogoWhite} height={32} alt="Logo White" />
                </Link>
              </div>
              <div className="flex items-center w-100 w-auto-l flex-grow-1 flex-grow-0-l justify-center justify-start-l order-0 order-1-l mb2 mb0-ns">
                <a
                  className="pa1"
                  target="_blank" rel="noopener noreferrer"
                  href="https://dashboard.baqend.com/privacy">
                  Privacy Policy
                </a>
                <a
                  className="pa1"
                  target="_blank" rel="noopener noreferrer"
                  href="https://dashboard.baqend.com/terms">
                  Terms of Service
                </a>
                <a
                  className="pa1"
                  target="_blank" rel="noopener noreferrer"
                  href="https://dashboard.baqend.com/imprint">
                  Imprint
                </a>
                <a className="pa1" href="" onClick={this.getRandomExample}>
                  Examples
                </a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: '#12212e' }}>
          <div className="container ph2 pv1">
            <small style={{ whiteSpace: 'nowrap' }}>© 2018 Baqend</small>
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

export default withRouter(connect(mapStateToProps, null)(Footer))
