import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './ResultScreen.css'
import ConfigForm from '../ConfigForm/ConfigForm'

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    console.log(this.props)
  }

  render() {
    console.log(this.props.config)
    // const { state } = this.props
    return (
      <div className="flex flex-column results__wrapper animated slideInUp" style={{animationDuration: '0.8s'}}>
        <div className="container pa2 pb7">
          <div>Result</div>
          <ConfigForm config={this.props.config} showConfig={false} onSubmit={this.props.onSubmit} />
        </div>
        <div className="flex-grow-1 results">
          <div className="container pa2">
            <div className="box-shadow results__box pa2" style={{ marginTop: '-96px' }}>
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo<br />
              Results yo
            </div>
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
            Results yo<br />
          </div>
        </div>
      </div>
    )
  }

}

ResultScreenComponent.propTypes = {
  onSubmit: PropTypes.func.isRequired,
}

export default ResultScreenComponent
