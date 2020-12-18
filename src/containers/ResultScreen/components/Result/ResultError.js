import React, { Component } from 'react'
import './ResultError.css'
import Header from '../../../../components/Header/Header'
import DeviceContainer from 'components/DeviceContainer/DeviceContainer'
import Footer from '../../../../components/Footer/Footer'
import ContactForm from '../../../../components/ContactForm/ContactForm'

class ResultError extends Component {
  constructor(props) {
    super(props)
  }

  renderMailInput() {
    return (
      <div>
        <div className="text-center mb5">
          {this.props.result.testOverview.documentRequestFailed ? (
            <h1 className="header">We where blocked by your infrastructure</h1>
          ) : (
            <div>
              <h1 className="header">Manual Test Required</h1>
              <ContactForm onlyMail={true}/>
            </div>
          )}
        </div>
      </div>
    )
  }

  renderErrorInfo() {
    return (
      <div className="text-center error-info-box">
        {this.props.result.testOverview.documentRequestFailed ? (
          <div>
            Unfortunately, your website cannot be analyzed because our request that is used
            to test the performance of your website was blocked by your infrastructure.
          </div>
        ) : (
          <div>
            Unfortunately, your website cannot be tested with our default test configuration.
            Please enter your email address and our team will quickly get back to you with a manual performance test.
          </div>
        )}
      </div>
    )
  }

  render() {
    return (
      <div className="flex-column flex-grow-1 flex items-center result-error">
        <Header changeColorOnResize={true} />
        <DeviceContainer
          embedded={false}
          mobile={this.props.config.mobile}
          content={
            <div className={`flex-grow-1 flex justify-center`}>
              <div className="flex-grow-1">
                {this.renderMailInput()}
                {this.renderErrorInfo()}
              </div>
            </div>
          }
        />
        <Footer isResultPage={false}/>
      </div>
    )
  }
}

export default ResultError
