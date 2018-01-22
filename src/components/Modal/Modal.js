import React from 'react'
import PropTypes from 'prop-types'

class Modal extends React.Component {
  componentWillMount() {
    document.addEventListener('mousedown', this.handleClick, false)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, false)
  }

  handleClick = (e) => {
    if (this.node && this.node.contains(e.target)) {
      return
    }
    this.props.show && this.handleOutsideClick()
  }

  handleOutsideClick = () => {
    // debugger
    this.props.onOutsideClick()
  }

  render() {
    if(!this.props.show) {
      return null
    }

    const backdropStyle = {
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      padding: 50
    }

    // The modal "window"
    const modalStyle = {
      backgroundColor: '#fff',
      borderRadius: 5,
      maxWidth: 768,
      minHeight: 300,
      margin: '0 auto',
      padding: 32,
      animationDuration: '0.35s'
    }

    return (
      <div className="backdrop" style={backdropStyle}>
        <div className="modal animated bounceInDown fadeInDown" style={modalStyle} ref={node => this.node = node}>
          {this.props.children}
        </div>
      </div>
    )
  }
}

Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool,
  children: PropTypes.node
}

export default Modal
