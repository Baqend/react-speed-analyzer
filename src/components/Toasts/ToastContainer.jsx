import React, { Component } from "react"
import PropTypes from "prop-types"

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { removeError } from '../../actions/errors'

import './Toasts.css'
import Toast from './Toast'

class ToastContainer extends Component {
  render() {
    return (
      <div className="toasts">
        {this.props.errors.map(error => {
          const message = error.message ? error.message : error
          return (
            <Toast key={message} message={message} dismiss={() => this.props.actions.removeError(error)} />
          )
        })}
      </div>
    )
  }
}


ToastContainer.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.any).isRequired
}

function mapStateToProps(state) {
  return {
    errors: state.errors
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      removeError
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ToastContainer)
