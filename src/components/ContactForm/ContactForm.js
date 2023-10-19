import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ContactFormComponent from "./ContactFormComponent";

class ContactForm extends Component {
  onSubmit = async (formData) => {
    const data = {
      ...formData,
      website: this.props.testOverview.url,
      config: this.props.config,
      testOverview: this.props.testOverview,
      subject: `[Analyzer] ${this.props.testOverview.url} - ${this.props.testOverview.status}`,
    };

    console.log(this.props.testOverview);

    const resp = await fetch("https://bbq.app.baqend.com/v1/code/mailUs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    console.log(await resp.json());

    return;
  };

  render() {
    return <ContactFormComponent {...this.props} onSubmit={this.onSubmit} />;
  }
}

ContactForm.propTypes = {
  onSubmit: PropTypes.func,
  config: PropTypes.object,
  testOverview: PropTypes.object,
};

function mapStateToProps(state) {
  return {
    config: state.config,
    testOverview: state.result.testOverview,
  };
}

export default connect(mapStateToProps, null)(ContactForm);
