import React, { Component } from 'react'

const Marker = ({ style }) => (
  <svg
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    viewBox="-5 -5 56 64"
    width="47"
    aria-labelledby="Label__score-marker"
    style={style}>
    <title id="Label__score-marker">
      Graph label for speed score
    </title>
    <defs>
      <filter id="marker-dropshadow" x="-10%" y="-10%">
        <feGaussianBlur in="SourceAlpha" result="blur-out" stdDeviation="2"></feGaussianBlur>
        <feOffset in="blur-out" result="the-shadow" dx="0" dy="0"></feOffset>
        <feColorMatrix
          in="the-shadow"
          result="color-out"
          type="matrix"
          values="0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0 .25 0">
        </feColorMatrix>
        <feBlend in="SourceGraphic" in2="color-out" mode="normal"></feBlend>
      </filter>
    </defs>
    <g filter="url(#marker-dropshadow)">
      <path id="path-1_9_" d="M23.2,0c12.9,0,23.2,10.2,23.2,22.9c0,6.4-3.6,13.2-13,22.4L23.2,55.4L12.9,45.3 C3.6,36,0,29.2,0,22.9C0,10.2,10.4,0,23.2,0L23.2,0z" style={{ fill: 'white' }}></path>
    </g>
  </svg>
)

const Bobbel = ({ description, time, style, upsideDown }) => (
  <div className="flex justify-center items-center absolute" style={style}>
    <div className="relative">
      <div style={{ position: 'absolute', left: 54, top: upsideDown ? 14 : 8, whiteSpace: 'nowrap' }}>
        <small style={{ fontWeight: 600, fontSize: 12 }}>{description}</small>
      </div>
      <span style={{ position: 'absolute', display: 'block', width: '100%', textAlign: 'center', top: upsideDown ? 19 : 13, fontWeight: 400, fontSize: 14, zIndex: 1 }}>{time}</span>
      <Marker style={{ transform: upsideDown ? 'rotate(180deg)' : null }} />
    </div>
  </div>
)

const calculateOffset = (maxTime, time) => maxTime / 1000 * time

class ResultScaleComponent extends Component {
  render() {
    const { speedKitError, competitorTest, speedKitTest, mainMetric } = this.props.result
    const maxTime = 10

    const competitorTime = competitorTest.firstView && competitorTest.firstView[mainMetric]
    const speedKitTime = !speedKitError && speedKitTest.firstView && speedKitTest.firstView[mainMetric]

    const competitorOffset = competitorTime && calculateOffset(maxTime, competitorTime)
    const speedKitOffset = speedKitTime && calculateOffset(maxTime, speedKitTime)

    return (
      <div className={`relative pt4 mt1 ${(speedKitTime && 'pb3') || 'pb1'}`}>
        {competitorTime && (
          <Bobbel
            description="Your Website"
            time={`${Math.round(competitorTime / 100) / 10}s`}
            style={{ left: `${competitorOffset}%`, top: -8, marginLeft: -22.5 }}
          />
        )}
        {speedKitTime && (
          <Bobbel
            description="With Speedkit"
            time={`${Math.round(speedKitTime / 100) / 10}s`}
            style={{ left: `${speedKitOffset}%`, top: 64, marginLeft: -22.5 }}
            upsideDown
          />
        )}
        <div className="flex" style={{ fontWeight: 400 }}>
          <div className="w-10 pa1 dark-green bg-dark-green border-left">Excellent</div>
          <div className="w-20 pa1 green bg-light-green">Good</div>
          <div className="w-30 pa1 orange bg-light-orange">Fair</div>
          <div className="w-40 pa1 red bg-light-red border-right">Poor</div>
        </div>
      </div>
    )
  }
}

export default ResultScaleComponent
