import React, { Component } from 'react'

import { connect } from 'react-redux'

import { withRouter } from 'react-router'

import './Footer.css'
import PropTypes from 'prop-types'

class Footer extends Component {
  getRandomExample = (e) => {
    e.preventDefault()
    const { history } = this.props
    const ids = this.props.examples.map(example => example.id)
    const randomId = ids[Math.floor(Math.random() * ids.length)]
    history.push(`/test/${randomId}/result`)
  }

  render() {
    return (
      <footer>
        <div className={`container ${this.props.isResultPage && 'result-page'}`}>
          <div className="flex justify-center company">
            POWERED BY BAQEND
          </div>
          <div className="flex justify-center">
            <a
              className="pa1"
              target="_blank" rel="noopener noreferrer"
              href="https://dashboard.baqend.com/privacy">
              Privacy Policy
            </a>
            <span style={{ alignSelf: "center" }}>-</span>
            <a
              className="pa1"
              target="_blank" rel="noopener noreferrer"
              href="https://dashboard.baqend.com/terms">
              Terms of Service
            </a>
            <span style={{ alignSelf: "center" }}>-</span>
            <a
              className="pa1"
              target="_blank" rel="noopener noreferrer"
              href="https://dashboard.baqend.com/imprint">
              Imprint
            </a>
            {/*<span style={{ alignSelf: "center" }}>-</span>*/}
            {/*<a className="pa1" href="" onClick={this.getRandomExample}>*/}
            {/*  Examples*/}
            {/*</a>*/}
          </div>
        </div>
      </footer>
    )
  }
}

Footer.propTypes = {
  isResultPage: PropTypes.bool.isRequired,
}

function mapStateToProps(state) {
  return {
    examples: state.examples,
  }
}

export default withRouter(connect(mapStateToProps, null)(Footer))
