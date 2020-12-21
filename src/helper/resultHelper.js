import { roundToTenths, zeroSafeDiv } from './maths'

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
 * @return {string|null}
 */
export function calculateAbsolute(competitorMetric, speedKitMetric) {
  if (!competitorMetric || !speedKitMetric) {
    return null
  }

  const improvement = competitorMetric - speedKitMetric
  if (Math.abs(improvement) > 999) {
    return `${Math.round(improvement / 1000 * 10) / 10} s`
  }
  return `${improvement} ms`
}

/**
 * @param competitorMetric Metric from the competitor's site.
 * @param speedKitMetric Metric from Speed Kit.
 * @return {number | null}
 */
export function calculatePercent(competitorMetric, speedKitMetric) {
  if (!competitorMetric || !speedKitMetric) {
    return null
  }

  const absolute = competitorMetric - speedKitMetric
  if (absolute <= 0) {
    return 0
  }

  const percentage = (100 / competitorMetric) * absolute
  return Math.round(percentage).toFixed(0)
}

/**
 * @param configAnalysis The information of the speed kit installation status
 * @returns {boolean} true, if speed kit was installed correctly
 */
export function isSpeedKitInstalledCorrectly(configAnalysis = {}) {
  const { configMissing, isDisabled, swPath, swPathMatches } = configAnalysis
  if (!swPath || swPath.length <= 0) {
    return false
  }

  return !configMissing && !isDisabled && swPathMatches
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
  if (!competitorResult.firstView || !speedKitResult.firstView) {
    return false
  }

  if ((speedKitResult.testInfo && speedKitResult.testInfo.isSpeedKitComparison) || isPlesk) {
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
