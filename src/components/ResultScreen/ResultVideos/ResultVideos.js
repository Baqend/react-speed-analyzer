import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ResultVideosComponent from './ResultVideosComponent'

class ResultVideos extends Component {
  onSubmit = () => {
    console.log('Submit')
  }

  render() {
    return (
      <ResultVideosComponent { ...this.props } onSubmit={this.onSubmit}/>
    )
  }
}

ResultVideos.propTypes = {
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
  speedKitError: PropTypes.bool.isRequired,
}

export default ResultVideos
