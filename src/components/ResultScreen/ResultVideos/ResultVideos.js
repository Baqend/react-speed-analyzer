import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ResultVideosComponent from './ResultVideosComponent'

class ResultVideos extends Component {
  render() {
    return (
      <ResultVideosComponent { ...this.props }/>
    )
  }
}

ResultVideos.propTypes = {
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
}

export default ResultVideos
