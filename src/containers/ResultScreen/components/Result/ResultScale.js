import React, {Component} from 'react'
import { roundMsToSec } from "../../../../helper/maths";

const maxScaleInMs = 2.5

const PERCENTAGE_THRESHOLD_IN_MS = 2.2
const MIN_DISTANCE = 0.15

const Marker = ({style}) => (
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
      <path id="path-1_9_"
            d="M23.2,0c12.9,0,23.2,10.2,23.2,22.9c0,6.4-3.6,13.2-13,22.4L23.2,55.4L12.9,45.3 C3.6,36,0,29.2,0,22.9C0,10.2,10.4,0,23.2,0L23.2,0z"
            style={{fill: 'white'}}></path>
    </g>
  </svg>
)

/**
 * Draws a bobbel for the scale.
 *
 * @param {string} description The description which will be positioned around the bobble.
 * @param {number} time The time which will be displayed inside of the bobble.
 * @param {string} style Additional style changes.
 * @param {boolean} upsideDown If true, the bobble will be displayed upside down (with the tip pointing upwards).
 * @param {boolean} absolute Indicates whether the description should be positioned absolute.
 * @param {boolean} mobile Indicates whether the state of the screen is mobile or not.
 * @param {number} order If the order is 1, the description will be shown on the top right. Otherwise top left.
 * @param {number} delta Indicates the difference between two bobbles.
 * @param {number} offset Indicates the position in percentage from the right dependent on screen size.
 */
const Bobbel = ({description, time, style, upsideDown, absolute, mobile, order, delta, offset}) => (
  <div
    className={`flex justify-center items-center ${absolute ? 'absolute' : ''}`}
    style={style}>
    <div
      className={`relative flex justify-center ${mobile || delta === 0 ? '' : 'flex-column'} ${order && delta < 250 ? ((order === 2 && 'items-end') || 'items-start') : 'items-center'}`}>
      <div style={{
        // 'margin-left' is only used for desktop test results with time difference
        marginLeft: (delta === 0 && !mobile) ? (offset < 55 ? -70 : 70) : '',
        // 'right' is only used for mobile test results
        right: mobile ? (offset < 55 ? 54 : -90) : '',
        top: upsideDown ? 14 : 8,
        whiteSpace: 'nowrap',
        position: mobile || delta === 0 ? 'absolute' : 'initial',
        order: mobile ? 1 : 0
      }}>
        <small style={{fontWeight: 600, fontSize: 12}}>{description}</small>
      </div>
      <span style={{
        position: 'absolute',
        display: 'block',
        width: delta < 250 ? 47 : '100%',
        textAlign: 'center',
        top: mobile || delta === 0 ? ((upsideDown && 19) || 13) : 38,
        fontWeight: 400,
        fontSize: 14,
        zIndex: 1
      }}>
        {time}
      </span>
      <Marker style={{transform: upsideDown ? 'rotate(180deg)' : null}}/>
    </div>
  </div>
)

/**
 * Calculates the representing percentage share of the fastest result.
 *
 * @param {number} time
 * @returns {number} Calculated percentage share is between 0 and 0.8 of the fastest result.
 */
const calculatePercentageForFirstBobble = (time, maxRange = maxScaleInMs) => {
  if (time > maxRange) {
    return 0.8
  }

  // time = 0.1 should start at the far right, therefore we subtract it from the result
  const firstPercentage = 0.8 * 0.1 / maxRange

  return 0.8 * time / maxRange - firstPercentage
}

/**
 * Calculates the representing percentage share of the slowest result.
 *
 * @param {number} firstTime
 * @param {number} secondTime
 * @returns {number} Calculated percentage share is between 0 and 0.8 of the slowest result.
 */
const calculatePercentageForSecondBobble = (firstTime, secondTime) => {
  const timeDifference = secondTime - firstTime
  let result = 0.8 * secondTime / maxScaleInMs
  if (timeDifference === 0) {
    return calculatePercentageForFirstBobble(firstTime)
  } else if (secondTime > maxScaleInMs || result > 0.83 - MIN_DISTANCE) {
    // avoids that the second bobble goes beyond the scale
    return 0.83
  } else if ((timeDifference !== 0.1 || 0) && firstTime >= PERCENTAGE_THRESHOLD_IN_MS) {
    // if the first bobble is too far left, don't add 15%
    return result
  }

  return result + MIN_DISTANCE
}

const getDescriptionForFirstBobble = (speedKitTime, competitorTime, hasSpeedKitInstalled) => {
  if (speedKitTime < competitorTime && !hasSpeedKitInstalled) {
    return 'With Speed Kit'
  } else if (speedKitTime >= competitorTime && hasSpeedKitInstalled) {
    return 'Without Speed Kit'
  }

  return 'Your Website'
}

const getDescriptionForSecondBobble = (speedKitTime, competitorTime, hasSpeedKitInstalled) => {
  if (speedKitTime < competitorTime && hasSpeedKitInstalled) {
    return 'Without Speed Kit'
  } else if (speedKitTime >= competitorTime && !hasSpeedKitInstalled) {
    return 'With Speed Kit'
  }

  return 'Your Website'
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
      this.setState({windowWidth, width})
    } else {
      this.setState({windowWidth})
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
    const {speedKitError, competitorTest, speedKitTest, mainMetric, testOverview} = this.props.result
    // round times
    const competitorTimeRounded = competitorTest.firstView && competitorTest.firstView[mainMetric] && roundMsToSec(competitorTest.firstView[mainMetric])
    const speedKitTimeRounded = speedKitTest.firstView && !speedKitError && speedKitTest.firstView[mainMetric] && roundMsToSec(speedKitTest.firstView[mainMetric])

    // give order
    const competitorOrder = competitorTimeRounded >= speedKitTimeRounded ? 2 : 1
    const speedKitOrder = speedKitTimeRounded > competitorTimeRounded ? 2 : 1
    const firstTime = competitorOrder > speedKitOrder ? speedKitTimeRounded : competitorTimeRounded
    // it is also secondTime, if one test is null
    const secondTime = speedKitOrder > competitorOrder ? speedKitTimeRounded : competitorTimeRounded

    // calculate percentage to px depending on width and the percentage of scale
    let firstBobblePercentage = calculatePercentageForFirstBobble(firstTime)

    // if the second bobble is over our scale, recalculate the first bobble's position with second time as max range
    if (secondTime > maxScaleInMs) {
      firstBobblePercentage = calculatePercentageForFirstBobble(firstTime, secondTime)
    }

    const secondBobblePercentage = calculatePercentageForSecondBobble(firstTime, secondTime)

    const hasSpeedKitInstalled = testOverview.isSpeedKitComparison
    const timeDelta = secondTime - firstTime

    return (
      <div ref={(container) => {
        if (!this.scalaContainer) {
          this.scalaContainer = container
          this.updateWidths()
        }
      }}>
        <div className={`relative pt4 pt5-ns mt1 ${(speedKitTimeRounded && 'pb4 mb1 pb3-ns mb0-ns') || 'pb1'}`}>
          {secondTime && this.state.windowWidth < 480 && (
            <Bobbel
              description={getDescriptionForSecondBobble(speedKitTimeRounded, competitorTimeRounded, hasSpeedKitInstalled)}
              time={`${secondTime}s`}
              style={{right: `${secondBobblePercentage * 100}%`, top: -8, marginLeft: -22.5}}
              offset={secondBobblePercentage * 100}
              absolute
              mobile
            />
          )}
          {firstTime && this.state.windowWidth < 480 && (
            <Bobbel
              description={getDescriptionForSecondBobble(speedKitTimeRounded, competitorTimeRounded, hasSpeedKitInstalled)}
              time={`${firstTime}s`}
              style={{right: `${firstBobblePercentage * 100}%`, top: 64, marginLeft: -22.5}}
              offset={firstBobblePercentage * 100}
              absolute
              mobile
              upsideDown
            />
          )}
          <div className="flex" style={{
            fontWeight: 400,
            background: 'linear-gradient(to left, rgb(200, 228, 176), rgb(255, 251, 199), rgb(255, 221, 221))'
          }}>
            <div className="w-50 pa1 red border-left">Average</div>
            <div className="w-50 pa1 dark-green border-right tr">Fast</div>
          </div>
          <div className="flex absolute" style={{top: 0, width: '100%', flexDirection: 'row-reverse'}}>
            {secondTime && this.state.windowWidth >= 480 && this.state.width && (
              <Bobbel
                description={getDescriptionForSecondBobble(speedKitTimeRounded, competitorTimeRounded, hasSpeedKitInstalled)}
                time={`${secondTime}s`}
                order={2}
                delta={timeDelta}
                offset={firstBobblePercentage * 100}
                style={{
                  marginTop: timeDelta === 0 ? 80 : -8,
                  order: 2,
                  paddingRight: timeDelta === 0 ? `${firstBobblePercentage * 100}%` : '',
                  // because the margin of the second bobble depends on the first bobble, we need to subtract the first bobble
                  marginRight: timeDelta === 0 ? '' : `${secondBobblePercentage * 100 - firstBobblePercentage * 100}%`
                }}
                absolute={timeDelta === 0}
                upsideDown={timeDelta === 0}
              />
            )}
            {firstTime && this.state.windowWidth >= 480 && this.state.width && (
              <Bobbel
                description={getDescriptionForFirstBobble(speedKitTimeRounded, competitorTimeRounded, hasSpeedKitInstalled)}
                time={`${firstTime}s`}
                order={1}
                delta={timeDelta}
                offset={firstBobblePercentage * 100}
                style={{
                  marginTop: timeDelta === 0 ? 8 : -8,
                  order: 1,
                  paddingRight: timeDelta === 0 ? `${firstBobblePercentage * 100}%` : '',
                  marginRight: timeDelta === 0 ? '' : `${firstBobblePercentage * 100}%`
                }}
                absolute={timeDelta === 0}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default ResultScaleComponent
