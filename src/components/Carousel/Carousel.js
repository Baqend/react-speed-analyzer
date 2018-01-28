import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './Carousel.css'

class Carousel extends Component {
  render() {
    return (
      <div className="treadmill">

        <div className="first" style={{ animationDuration: this.props.animationDuration, animationDelay: this.props.animationDelay }}>
          {this.props.children.map((child, i) => (
            <div key={i} className="treadmill-item">
              {child}
            </div>
          ))}
        </div>

        <div className="second" style={{ animationDuration: this.props.animationDuration, animationDelay: this.props.animationDelay  }}>
          {this.props.children.map((child, i) => (
            <div key={i} className="treadmill-item">
              {child}
            </div>
          ))}
        </div>
      </div>
    )
  }
}

Carousel.propTypes = {
  animationDuration: PropTypes.string,
  animationDelay: PropTypes.string
}

export default Carousel
