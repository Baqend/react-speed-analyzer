import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import StartingScreenComponent from './StartingScreenComponent'

class StartingScreen extends Component {
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
            <StartingScreenComponent state={this.state}/>
        )
    }
}

StartingScreen.propTypes = {

}

function mapStateToProps(state) {
    return { }
}

function mapDispatchToProps(dispatch) {
    return { }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
