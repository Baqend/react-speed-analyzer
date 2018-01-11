import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ResultDetailsComponent from './ResultDetailsComponent'

class ResultDetails extends Component {
  render() {
    return (
      <ResultDetailsComponent { ...this.props }/>
    )
  }
}

ResultDetails.propTypes = {
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
}

export default ResultDetails
