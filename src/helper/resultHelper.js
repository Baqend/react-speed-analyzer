import { roundToTenths, roundToHundredths, zeroSafeDiv, formatPercentage } from './maths'

/**
 * @param competitorMetric Metric from the competitor's site.
 * @param speedKitMetric Metric from Speed Kit.
 * @return {number}
 */
export function calculateFactor(competitorMetric, speedKitMetric) {
  if (!competitorMetric || !speedKitMetric) {
    return null
  }

  return roundToTenths(zeroSafeDiv(competitorMetric, speedKitMetric))
}

/**
 * @param competitorMetric Metric from the competitor's site.
 * @param speedKitMetric Metric from Speed Kit.
 * @return {number}
 */
export function calculateAbsolute(competitorMetric, speedKitMetric) {
  if (!competitorMetric || !speedKitMetric) {
    return null
  }

  const improvement = competitorMetric - speedKitMetric
  if (Math.abs(improvement) > 99) {
    return `${Math.round(improvement / 1000 * 10) / 10} s`
  }
  return `${improvement} ms`
}

/**
 * @param competitorMetric Main metric from the competitor's site.
 * @param speedKitMetric Main metric from Speed Kit.
 * @return {boolean}
 */
export function isMainMetricSatisfactory(competitorMetric, speedKitMetric) {
  if (competitorMetric > 0 && speedKitMetric > 0) {
    return roundToHundredths(competitorMetric / speedKitMetric) > 1.2
  }
  return false
}

/**
 * @param competitorResult The test result from the competitor's site.
 * @param speedKitResult The test result from the Speed Kit.
 * @param mainMetric Main metric for the test.
 * @param secondaryMetric Secondary metric for the test.
 * @param isPlesk Flag tha indicates whether the test was started by plesk.
 * @return {boolean}
 */
export function resultIsValid(competitorResult, speedKitResult, mainMetric, secondaryMetric, isPlesk) {
  if (!speedKitResult.firstView) {
    return false
  }

  if (speedKitResult.testInfo.isSpeedKitComparison || isPlesk) {
    return true
  }

  const mainCompetitor = competitorResult.firstView[mainMetric]
  const mainSpeedKit = speedKitResult.firstView[mainMetric]
  const secondaryCompetitor = competitorResult.firstView[secondaryMetric]
  const secondarySpeedKit = speedKitResult.firstView[secondaryMetric]

  if (mainCompetitor > 0 && mainSpeedKit > 0) {
    if ((mainSpeedKit / mainCompetitor < 0.95) || (mainCompetitor - mainSpeedKit > 200)) {
      return true
    } else if (mainSpeedKit + 50 <= mainCompetitor) {
      if(secondarySpeedKit / secondaryCompetitor < 0.9) {
        return true
      }
    }
    return false
  }
  return false
}

/**
 * @param {*} data
 * @return {string}
 */
export function calculateServedRequests(data) {
  const totalRequests = data.requests || 0

  /* eslint-disable */
  const cacheHits = data.hits.hit || 0
  const cacheMisses = data.hits.miss || 0
  const otherRequests = data.hits.other || 0

  // eslint-disable-next-line no-console
  // console.log(`hit: ${cacheHits} miss: ${cacheMisses} other: ${otherRequests} total: ${totalRequests}`)

  const servedFactor = (totalRequests - otherRequests) / totalRequests
  return formatPercentage(servedFactor)
}
