import React, { Component } from 'react'

import './ResultScale.css'

class ResultScaleComponent extends Component {
  render() {
    return (
      <div className="relative">
        <div className="flex pr6 pl6">
          <div className="w-100">
            <div className="absolute">Pointer A</div>
            <div className="absolute">Pointer B</div>
          </div>
        </div>
        <div className="flex pa2 pr6 pl6">
          <div className="w-10 pa1 white bg-dark-green border-left">Excellent</div>
          <div className="w-20 pa1 green bg-light-green">Good</div>
          <div className="w-30 pa1 orange bg-light-orange">Fair</div>
          <div className="w-40 pa1 red bg-light-red border-right">Poor</div>
        </div>
      </div>
    )
  }
}

export default ResultScaleComponent
