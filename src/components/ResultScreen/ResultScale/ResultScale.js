import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ResultScaleComponent from './ResultScaleComponent'

class ResultScale extends Component {
  render() {
    return (
      <ResultScaleComponent { ...this.props }/>
    )
  }
}

ResultScale.propTypes = {
}

export default ResultScale
