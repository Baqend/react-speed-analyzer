import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import StartingScreenComponent from './StartingScreenComponent'
import './StartingScreen.css'

import { parse } from 'query-string'
import { getObjectKey } from '../../helper/utils'
import { isURL } from '../../helper/utils'

import { resetConfig } from '../../actions/config'
import { terminateTest } from '../../actions/terminateTest'
import { resetTest, monitorTest } from '../../actions/monitorTest'
import { prepareTest, startTest } from '../../actions/startTest'


class StartingScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showAdvancedConfig: false
    }
  }

  reset = () => {
    this.props.actions.resetConfig()
    this.props.actions.resetTest()
  }

  parseQueryString = (queryString) => {
    const params = {}
    queryString.replace('?','').split('&').forEach(p => {
      const param = p.split('=')
      params[param[0]] = param[1] ? param[1] : true
    })
    return params
  }

  startTest = async (url = null) => {
    const { history } = this.props
    try {
      const urlInfo = await this.props.actions.prepareTest()
      history.push('/')
      const testOverview = await this.props.actions.startTest(urlInfo)
      history.push(`/test/${getObjectKey(testOverview.id)}`)
    } catch (e) {}
  }

  checkTest = (props) => {
    const { history } = props
    const { testId } = props.match.params
    const { testOverview, isStarted, isMonitored, isFinished } = props.result
    // debugger
    // if (!testId && testOverview.id && testOverview.competitorTestResult) {
    //   history.push(`/test/${getObjectKey(testOverview.id)}`)
    // }

    if (testId && !isMonitored) {
      this.props.actions.monitorTest(testId).catch((e) => {
        this.props.actions.resetTest()
        history.replace('/')
      })
    }

    if (testId && isFinished) {
      history.replace(`/test/${testId}/result`)
    }
  }

  onSubmit = () => {
    if (isURL(this.props.config.url)) {
      this.startTest()
    }
  }

  componentWillMount() {
    // debugger
    // this.reset()
    // const { location } = this.props
    // const params = location.search.replace('?', '').split('&')
    // const testId = this.props.match.params.testId
    // if(testId) {
    //   this.props.actions.monitorTest(testId)
    // }
    if (!this.props.result.isInitiated) {
      this.reset()
    }

    const params = this.parseQueryString(this.props.location.search)
    // debugger
    if (params.url) {
      this.startTest(params.url)
    }
    if (params.advanced) {
      this.setState({ showAdvancedConfig: true })
    }
    // this.checkTest(this.props)
    // this.setState({ showAdvancedConfig: params.advanced || false })
  }

  componentWillReceiveProps(nextProps) {
    this.checkTest(nextProps)
    // debugger
    // const { history } = this.props
    // change the location attribute if a new test was triggered
    // debugger
    // const testOverview = nextProps.testOverview
    // if(testOverview.competitorTestResult && testOverview.speedKitTestResult ) {
    //   const testId = getObjectKey(testOverview.id)
    //   if(nextProps.location.search.indexOf(testId) === -1) {
    //     nextProps.history.push(`?testId=${testId}`)
    //   }
    // }
    //
    // // add the test id as new location and trigger monitoring process
    // if(nextProps.location !== this.props.location) {
    //   const testId = parse(nextProps.location.search)['testId']
    //   if(testId) {
    //     this.props.actions.monitorTest(testId)
    //   }
    // }
    //
    // // terminate the running test as soon as both test have finished and navigate to the result screen
    // if(nextProps.competitorTest.hasFinished && nextProps.speedKitTest.hasFinished) {
    //   this.props.actions.terminateTest()
    //   debugger
    //   nextProps.history.push('/result' + nextProps.location.search)
    //   // history.push(`/test/${nextProps.testOverview.id}`)
    //   const testId = this.props.match.params.testId
    // }
  }

  render() {
    return (
      <StartingScreenComponent { ...this.props } { ...this.state} onSubmit={this.onSubmit} />
    )
  }
}

StartingScreen.propTypes = {
  testOverview: PropTypes.object,
  actions: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  isRateLimited: PropTypes.bool.isRequired,
  isBaqendApp: PropTypes.bool.isRequired,
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    testOverview: state.result.testOverview,
    config: state.config,
    isRateLimited: state.result.isRateLimited,
    isBaqendApp: state.result.isBaqendApp,
    competitorTest: state.result.competitorTest,
    speedKitTest: state.result.speedKitTest,
    result: state.result,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      resetConfig,
      prepareTest,
      startTest,
      resetTest,
      monitorTest,
      terminateTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
