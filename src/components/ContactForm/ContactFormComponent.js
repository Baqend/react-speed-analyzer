import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './ConfigForm.css'

class ContactFormComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      name: '',
      mail: '',
      message: '',
    }
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value })
  }

  handleSubmit = (event) => {
    event.preventDefault()
    this.props.onSubmit(this.state).then(() => {
      console.log("contact form sent")
    })
  }

  handleAbort = (event) => {
    event.preventDefault()
    this.props.onCancel && this.props.onCancel()
  }

  render() {
    return (
      <form className="contact__form w-100" onSubmit={this.handleSubmit}>
        <div className="mb1">
          <label htmlFor="name">Name</label>
          <input
            className="pa1 w-100"
            type="text"
            name="name"
            value={this.state.name}
            onChange={this.handleChange}
            required />
        </div>
        <div className="mb1">
          <label htmlFor="mail">Email</label>
          <input
            className="pa1 w-100"
            type="text"
            name="mail"
            value={this.state.mail}
            onChange={this.handleChange}
            required />
        </div>
        <div className="mb1">
          <label htmlFor="message">Tell us a bit about your needs. (optional)</label>
          <textarea
            className="pa1 w-100"
            type="text"
            name="message"
            value={this.state.message}
            onChange={this.handleChange}
            required />
        </div>
        <div className="flex justify-between">
          <button className="btn btn-orange btn-ghost btn-small" onClick={this.handleAbort}>Cancel</button>
          <button className="btn btn-orange btn-small" type="submit">Send</button>
        </div>
      </form>
    )
  }
}

ContactFormComponent.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func
}

export default ContactFormComponent
