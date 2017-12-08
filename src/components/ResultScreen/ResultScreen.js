import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import ResultScreenComponent from './ResultScreenComponent'

class ResultScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    componentDidMount() {

    }

    componentWillUnmount() {

    }

    render() {
        return (
            <ResultScreenComponent state={this.state}/>
        )
    }
}

ResultScreen.propTypes = {

}

function mapStateToProps(state) {
    return { }
}

function mapDispatchToProps(dispatch) {
    return { }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen)
