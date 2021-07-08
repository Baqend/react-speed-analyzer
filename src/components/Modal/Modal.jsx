import React from 'react'
import PropTypes from 'prop-types'

class Modal extends React.Component {
  constructor(props) {
    super(props)
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
      zIndex: 1234,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(33, 33, 33, 0.95)',
      padding: 32,
      display: 'flex',
      alignItems: 'center',
    }

    // The modal "window"
    const modalStyle = {
      backgroundColor: '#fff',
      borderRadius: 2,
      maxWidth: 768,
      minHeight: 300,
      margin: '0 auto',
      padding: 16,
      animationDuration: '0.35s',
      animationDelay: '0.15s',
    }

    return (
      <div className="backdrop" style={backdropStyle}>
        <div className="modal animated bounceInDown zoomIn" style={modalStyle} ref={node => this.node = node}>
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
