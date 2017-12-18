import React, { Component } from 'react'

import LogoWhite from '../../assets/logo_white.png'
import './Navbar.css'


class Navbar extends Component {
  render() {
    return (
      <nav>
        <img src={LogoWhite} alt="Logo White" />
      </nav>
    )
  }
}

export default Navbar
