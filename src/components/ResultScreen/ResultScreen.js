import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ResultScreenComponent from './ResultScreenComponent'

class ResultScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  onSubmit = () => {

  }

  render() {
    return (
      <ResultScreenComponent { ...this.props } state={this.state} onSubmit={this.onSubmit}/>
    )
  }
}

ResultScreen.propTypes = {
  config: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    config: state.config,
  }
}

function mapDispatchToProps(dispatch) {
  return { }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen)
