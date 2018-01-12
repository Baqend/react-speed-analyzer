import { roundToHundredths, zeroSafeDiv, formatPercentage } from './maths'

/**
 * @param competitorMetric Metric from the competitor's site.
 * @param speedKitMetric Metric from Speed Kit.
 * @return {number}
 */
export function calculateFactor(competitorMetric, speedKitMetric) {
  return roundToHundredths(zeroSafeDiv(competitorMetric, speedKitMetric))
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
 * @param competitorResult Result from the competitor's site.
 * @param speedKitResult Result from Speed Kit.
 * @return {boolean}
 */
export function shouldShowFirstMeaningfulPaint(competitorResult, speedKitResult) {
  // Competitor fully loaded minus competitor time to first byte ist bigger than ten seconds
  const firstCondition = competitorResult.fullyLoaded - competitorResult.ttfb > 10000

  // Speed kit served requests are 20% less than competitors served requests (exclude failed requests)
  const secondCondition = (speedKitResult.requests - speedKitResult.failedRequests)
    / (competitorResult.requests - competitorResult.failedRequests) <= 0.75

  // Speed kit's (fully loaded - last visual change ) - competitor's (fully loaded - last visual change ) is
  // 20% bigger than the max of all four values
  const competitorNum = Math.abs(competitorResult.fullyLoaded - competitorResult.lastVisualChange)
  const speedKitNum = Math.abs(speedKitResult.fullyLoaded - speedKitResult.lastVisualChange)
  const max = Math.max(
    competitorResult.fullyLoaded,
    competitorResult.lastVisualChange,
    speedKitResult.fullyLoaded,
    speedKitResult.lastVisualChange,
  )
  const thirdCondition = max / Math.abs(competitorNum - speedKitNum) <= 0.8

  return firstCondition || secondCondition || thirdCondition
}

/**
 * @param {*} data
 * @return {string}
 */
export function calculateServedRequests(data) {
  const totalRequests = data.requests || 0

  const cacheHits = data.hits.hit || 0
  const cacheMisses = data.hits.miss || 0
  const otherRequests = data.hits.other || 0

  // eslint-disable-next-line no-console
  console.log(`hit: ${cacheHits} miss: ${cacheMisses} other: ${otherRequests} total: ${totalRequests}`)

  const servedFactor = (totalRequests - otherRequests) / totalRequests
  return formatPercentage(servedFactor)
}
