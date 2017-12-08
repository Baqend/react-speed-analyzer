import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import LoadingScreenComponent from './LoadingScreenComponent'

class LoadingScreen extends Component {
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
            <LoadingScreenComponent state={this.state}/>
        )
    }
}

LoadingScreen.propTypes = {

}

function mapStateToProps(state) {
    return { }
}

function mapDispatchToProps(dispatch) {
    return { }
}

export default connect(mapStateToProps, mapDispatchToProps)(LoadingScreen)
