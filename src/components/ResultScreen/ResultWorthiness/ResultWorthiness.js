import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ResultWorthinessComponent from './ResultWorthinessComponent'

class ResultWorthiness extends Component {
  render() {
    return (
      <ResultWorthinessComponent { ...this.props }/>
    )
  }
}

ResultWorthiness.propTypes = {
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
  mainMetric: PropTypes.string,
}

export default ResultWorthiness
