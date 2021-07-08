import React, { Component } from 'react'
import './Header.css'
import PropTypes from 'prop-types'


class Header extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className={"flex flex-column items-center"}>
        <a href="/" className={`logo ${this.props.changeColorOnResize ? "resize" : ""}`}></a>
      </div>
    )
  }
}

Header.propTypes = {
  changeColorOnResize: PropTypes.bool.isRequired,
}

export default Header
