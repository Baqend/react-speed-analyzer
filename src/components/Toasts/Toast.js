import PropTypes from "prop-types"
import React, { Component } from "react"

class Toast extends Component {
  componentDidMount() {
    setTimeout(() => {
      this.props.dismiss()
    }, 5000)
  }

  render() {
    return (
      <div className="toast animated slideInRight" style={{ animationDuration: '0.3s' }}>
        <p className="toast__content">
          {this.props.message}
        </p>
        <button className="toast__dismiss" onClick={this.props.dismiss}>
          x
        </button>
      </div>
    )
  }

  shouldComponentUpdate() {
    return false
  }
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  dismiss: PropTypes.func.isRequired,
}

export default Toast
