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
    height="54"
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

const Bobbel = ({ description, time, style, upsideDown, absolute, mobile, order, delta, offset }) => (
  <div
    className={`flex justify-center items-center ${absolute ? 'absolute' : ''}`}
    style={style}>
    <div className={`relative flex justify-center ${mobile ? '' : 'flex-column'} ${order && delta < 250 ? ((order === 1 && 'items-end') || 'items-start') : 'items-center'}`}>
      <div style={{
        left: (mobile && offset < 60) ? 54 : (upsideDown ? -88 : -80),
        top: upsideDown ? 14 : 8,
        whiteSpace: 'nowrap',
        position: mobile ? 'absolute' : 'initial',
        order: mobile ? 1 : 0
      }}>
        <small style={{ fontWeight: 600, fontSize: 12 }}>{description}</small>
      </div>
      <span style={{
        position: 'absolute',
        display: 'block',
        width: delta < 250 ? 47: '100%',
        textAlign: 'center',
        top: mobile ? ((upsideDown && 19) || 13) : 38,
        right: order === 1 && delta < 250 ? 0 : 'auto',
        left: order === 2 && delta < 250 ? 0 : 'auto',
        fontWeight: 400,
        fontSize: 14,
        zIndex: 1
      }}>
        {time}
      </span>
      <Marker style={{ transform: upsideDown ? 'rotate(180deg)' : null }} />
    </div>
  </div>
)


const calculateMaxTimeForRequests = (requests, competitorTime) => {
  if (requests <= 50) {
    return 2500
  } else if (requests >= 400){
    return 8000
  }
  return Math.max(competitorTime, (0.0184884 * requests + 0.610465) * 1000)

}
const calculateOffset = (maxTime, time) => Math.min(95, time / maxTime * 100)

const calculateMargin = (containerWidth, offset1, offset2, order) => {
  if (offset2 && order === 2) {
    return Math.max(8, ((containerWidth * (offset1 - offset2) / 100) - 70))
  }
  return containerWidth * offset1 / 100 - 50
}

class ResultScaleComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      windowWidth: null,
      width: null
    }
    this.scalaContainerWidth = null
  }

  updateWidths = () => {
    const windowWidth = window.innerWidth
    const width = this.scalaContainer && this.scalaContainer.getBoundingClientRect().width
    if (width && (width !== this.state.width)) {
      this.setState({ windowWidth, width })
    } else {
      this.setState({ windowWidth })
    }
  }

  componentWillMount = () => {
    this.updateWidths()
  }

  componentDidMount = () => {
    window.addEventListener("resize", this.updateWidths)
  }

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.updateWidths)
  }

  render() {
    const { speedKitError, competitorTest, speedKitTest, mainMetric, testOverview } = this.props.result

    const requests = competitorTest.firstView && competitorTest.firstView.requests
    const competitorTime = competitorTest.firstView && competitorTest.firstView[mainMetric]
    const speedKitTime = speedKitTest.firstView && !speedKitError && speedKitTest.firstView[mainMetric]
    const isSpeedKitComparison = testOverview.isSpeedKitComparison

    const timeDelta = Math.abs(competitorTime - speedKitTime)

    const maxTime = calculateMaxTimeForRequests(requests, competitorTime)

    const competitorOffset = competitorTime && calculateOffset(maxTime, competitorTime)
    const speedKitOffset = speedKitTime && calculateOffset(maxTime, speedKitTime)

    const competitorOrder = competitorTime >= speedKitTime ? 2 : 1
    const speedKitOrder = speedKitTime > competitorTime ? 2 : 1

    return (
      <div ref={(container) => {
        if (!this.scalaContainer) {
          this.scalaContainer = container
          this.updateWidths()
        }
      }}>
        <div className={`relative pt4 pt5-ns mt1 ${(speedKitTime && 'pb4 mb1 pb3-ns mb0-ns') || 'pb1'}`}>
          {competitorTime && this.state.windowWidth < 480 && (
            <Bobbel
              description={isSpeedKitComparison ? `Without Speed Kit` : `Your Website`}
              time={`${Math.round(competitorTime / 100) / 10}s`}
              style={{ left: `${competitorOffset}%`, top: -8, marginLeft: -22.5 }}
              offset={competitorOffset}
              absolute
              mobile
            />
          )}
          {speedKitTime && this.state.windowWidth < 480 && (
            <Bobbel
              description={isSpeedKitComparison ? `Your Website` : `With Speed Kit`}
              time={`${Math.round(speedKitTime / 100) / 10}s`}
              style={{ left: `${speedKitOffset}%`, top: 64, marginLeft: -22.5 }}
              offset={speedKitOffset}
              absolute
              mobile
              upsideDown
            />
          )}
          <div className="flex" style={{ fontWeight: 400, background: 'linear-gradient(to right, #c8e4b0, #fef1ea, #fdecec)' }}>
            <div className="w-50 pa1 dark-green border-left">Fast</div>
            <div className="w-50 pa1 red border-right tr">Slow</div>
          </div>
          <div className="flex absolute" style={{ top: 0, width: '100%' }}>
            {speedKitTime && this.state.windowWidth >= 480 && this.state.width && (
              <Bobbel
                description={isSpeedKitComparison ? `Your Website` : `With Speed Kit`}
                time={`${Math.round(speedKitTime / 100) / 10}s`}
                order={speedKitOrder}
                delta={timeDelta}
                style={{
                  marginTop: -8,
                  order: speedKitOrder,
                  marginLeft: calculateMargin(this.state.width, speedKitOffset, competitorOffset, speedKitOrder)
                }}
              />
            )}
            {competitorTime && this.state.windowWidth >= 480 && this.state.width && (
              <Bobbel
                description={isSpeedKitComparison ? `Without Speed Kit` : `Your Website`}
                time={`${Math.round(competitorTime / 100) / 10}s`}
                order={competitorOrder}
                delta={timeDelta}
                style={{
                  marginTop: -8,
                  order: competitorOrder,
                  marginLeft: calculateMargin(this.state.width, competitorOffset, speedKitOffset, competitorOrder)
                }}
              />
            )}
          </div>

        </div>
        {/*<div className="">
          competitor Time: {competitorTime}, Speed Kit Time: {speedKitTime}, Requests: {requests}, maxTime: {maxTime}
        </div>*/}
      </div>
    )
  }
}

export default ResultScaleComponent
