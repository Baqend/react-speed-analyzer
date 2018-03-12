import React, { Component } from 'react'

import { Link } from 'react-router-dom'

import Logo from '../../assets/logo.png'
import LogoWhite from '../../assets/logo_white.png'
import './Navbar.css'


class Navbar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showStaticNavbar: false
    }
  }

  handleScroll = () => {
    if (this.getScrollPosition() > 60) {
      this.setState({ showStaticNavbar: true })
    } else {
      this.setState({ showStaticNavbar: false })
    }
  }

  getScrollPosition() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  }

  renderTransparentNavbar() {
    return (
      <div className="navbar-inner flex items-center justify-between">
        <div className="flex items-center">
          <Link className="mr2" to="/">
            <img src={LogoWhite} alt="Logo White" style={{ height: 44, marginTop: 8 }}/>
          </Link>
          <a
            className="btn btn-small btn-white no-border no-shadow dn db-ns"
            target="_blank" rel="noopener noreferrer"
            href="https://www.baqend.com/speedkit.html">Speed Kit</a>
          <a
            className="btn btn-small btn-white no-border no-shadow dn db-ns"
            target="_blank" rel="noopener noreferrer"
            href="https://www.baqend.com/speedkit.html#sk-features">Features</a>
          <a
            className="btn btn-small btn-white no-border no-shadow dn db-ns"
            target="_blank" rel="noopener noreferrer"
            href="https://www.baqend.com/pricing_speedkit.html">Pricing</a>
          <a
            className="btn btn-small btn-white no-border no-shadow dn db-ns"
            target="_blank" rel="noopener noreferrer"
            href="http://www.baqend.com/guide/topics/speed-kit/analyzer/">Analyzer</a>
        </div>
        <a
          className="btn btn-small btn-white"
          target="_blank" rel="noopener noreferrer"
          href="https://dashboard.baqend.com/register?appType=speedkit">Sign Up</a>
      </div>
    )
  }

  renderWhiteNavbar() {
    return (
      <div className="navbar-inner flex items-center justify-between">
        <div className="flex items-center">
          <Link className="mr2" to="/">
            <img src={Logo} alt="Logo White" style={{ height: 44, marginTop: 8 }}/>
          </Link>
          <a
            className="btn btn-small btn-black no-border no-shadow dn db-ns"
            target="_blank" rel="noopener noreferrer"
            href="https://www.baqend.com/speedkit.html">Speed Kit</a>
          <a
            className="btn btn-small btn-black no-border no-shadow dn db-ns"
            target="_blank" rel="noopener noreferrer"
            href="https://www.baqend.com/speedkit.html#sk-features">Features</a>
          <a
            className="btn btn-small btn-black no-border no-shadow dn db-ns"
            target="_blank" rel="noopener noreferrer"
            href="https://www.baqend.com/pricing_speedkit.html">Pricing</a>
          <a
            className="btn btn-small btn-black no-border no-shadow dn db-ns"
            target="_blank" rel="noopener noreferrer"
            href="http://www.baqend.com/guide/topics/speed-kit/analyzer/">Analyzer</a>
        </div>
        <a
          className="btn btn-small btn-orange no-shadow"
          target="_blank" rel="noopener noreferrer"
          href="https://dashboard.baqend.com/register?appType=speedkit">Sign Up</a>
      </div>
    )
  }

  render() {
    return [
      <nav key="transparent" className={`navbar-top ${this.state.showStaticNavbar && 'hidden'}`}>
        <div className="container ph2">
          {this.renderTransparentNavbar()}
        </div>
      </nav>,
      <nav key="white" className={`navbar-fixed-top ${this.state.showStaticNavbar && 'visible'}`}>
        <div className="container ph2">
          {this.renderWhiteNavbar()}
        </div>
      </nav>
    ]
  }
}

export default Navbar
