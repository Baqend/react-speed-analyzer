import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import './ConfigForm.css'

class ContactFormComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: {
        name: '',
        email: '',
        message: '',
      },
      formSent: false,
    }
  }

  handleChange = (event) => {
    event.persist()
    this.setState(prevState => ({
      data: {
        ...prevState.data,
        [event.target.name]: event.target.value
      }
    }))
  }

  handleSubmit = (event) => {
    event.preventDefault()
    this.props.onSubmit(this.state.data).then(() => {
      this.setState({ formSent: true })
    })
  }

  handleAbort = (event) => {
    event.preventDefault()
    this.props.onCancel && this.props.onCancel()
  }

  render() {
    return (
      <form className="contact__form w-100 mb5" onSubmit={this.handleSubmit}>
        {!this.props.onlyMail ? (
          <div>
            <div className="mb1">
              <label htmlFor="name">Name</label>
              <input
                className="pa1 w-100"
                type="text"
                name="name"
                value={this.state.data.name}
                onChange={this.handleChange}
                required />
            </div>
            <div className="mb1">
              <label htmlFor="email">Email</label>
              <input
                className="pa1 w-100"
                type="text"
                name="email"
                value={this.state.data.email}
                onChange={this.handleChange}
                required />
            </div>
            <div className="mb1">
              <label htmlFor="message">Tell us a bit about your needs. (optional)</label>
              <textarea
                className="pa1 w-100"
                type="text"
                name="message"
                value={this.state.data.message}
                onChange={this.handleChange}
                required />
            </div>
            <div className="flex justify-between">
              <button className="btn btn-purple btn-ghost btn-small" onClick={this.handleAbort}>Cancel</button>
              <button className="btn btn-purple btn-small" type="submit">Send</button>
            </div>
          </div>
        ) : (
          <div className="single-input-wrapper">
            <div className="mt4">
              <input
                className="single-input"
                type="text"
                name="email"
                placeholder="Enter Email Address"
                value={this.state.data.email}
                onChange={this.handleChange}
                required />
            </div>
            <div className="mt3">
              {this.state.formSent ? (
                <button className="btn btn-purple single-submit" disabled={true} style={{cursor: 'auto'}}>
                  <FontAwesomeIcon icon={faCheckCircle} className="mr1" style={{width: '26px', height: '26px'}}/>
                  TEST REQUESTED
                </button>
              ) : (
                <button className="btn btn-purple single-submit" type="submit">REQUEST MANUAL TEST</button>
              )}
            </div>
          </div>
        )}
      </form>
    )
  }
}

ContactFormComponent.propTypes = {
  onlyMail: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func
}

export default ContactFormComponent
