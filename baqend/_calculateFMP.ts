import { baqend } from 'baqend'
import fetch from 'node-fetch'
import { WptView } from './_Pagetest'
import credentials from './credentials'

/**
 * Get the raw visual progress data of a given html string.
 *
 * @param htmlString The html string to get the data from.
 * @return An array of the raw visual progress data.
 */
function getDataFromHtml(htmlString: string): Array<[number, number]> {
  const regex = /google\.visualization\.arrayToDataTable\((\[(.|\n)*])\);/gm
  const matchArray = regex.exec(htmlString)

  if (!matchArray || !matchArray[1]) {
    throw new Error('Could not find data table in HTML.')
  }

  const data = JSON.parse(matchArray[1].replace(/'/g, '"')) as Array<[string, number]>

  // Remove the first item of the data array because it has irrelevant data like "Time (ms)"
  data.shift()

  return data.map(row => [parseFloat(row[0]), row[1]] as [number, number])
}

async function prepareData(db: baqend, testId: string, runIndex: string): Promise<Array<[number, number]>> {
  const url = `http://${credentials.wpt_dns}/video/compare.php?tests=${testId}-r:${runIndex}-c:0`
  const response = await fetch(url)
  const htmlString = await response.text()
  const data = getDataFromHtml(htmlString)
  db.log.info('Found data for FMP calculation', {data})

  return data
}

function getWPTMetric(data: WptView) {
  // Search First Meaningful Paint from timing
  const { chromeUserTiming = [] } = data
  const firstMeaningfulPaintObject =
    chromeUserTiming
      .reverse()
      .find(entry => entry.name === 'firstMeaningfulPaint' || entry.name === 'firstMeaningfulPaintCandidate')

  return firstMeaningfulPaintObject ? firstMeaningfulPaintObject.time : 0
}

/**
 * Calculate first meaningful paint based on the given data.
 *
 * @param data An Array of visual progress raw data.
 * @return {object[]} The first meaningful paint value.
 */
function calculateFMP(data: Array<[number, number]>): number {
  let firstMeaningfulPaint = 0
  let highestDiff = 0

  if (data.length === 1) {
    return data[0][0] * 1000
  }

  for (let i = 1; i < data.length; i += 1) {
    const [time, visualProgress] = data[i]
    const diff = visualProgress - data[i - 1][1]

    // stop loop if the visual progress is negative => FMP is last highest diff
    if (diff < 0) {
      break
    }

    // The current diff is the highest and the visual progress is at least 50%
    if (diff > highestDiff) {
      highestDiff = diff
      firstMeaningfulPaint = time
    }

    if (highestDiff >= 50) {
      break
    }
  }

  return firstMeaningfulPaint * 1000
}

function isWPTMetricValid(db: baqend, wptMetric: number, data: Array<[number, number]>): boolean {
  const diffs = [];
  if (data.length === 1) {
    const [time] = data[0]
    return Math.abs(time * 1000 - wptMetric) <= 100
  }

  for (let i = 1; i < data.length; i += 1) {
    const [time, visualProgress] = data[i]
    const diff = visualProgress - data[i - 1][1]

    diffs.push({ diff, time})
  }

  const candidates = diffs.sort((a, b) => {
    if (a.diff < b.diff) { return 1 }
    else if (a.diff == b.diff) { return 0 }
    else { return -1 }
  }).slice(0, 3)

  db.log.info('Candidates for FMP found', {candidates})
  return candidates.some(candidate => Math.abs(candidate.time * 1000 - wptMetric) <= 100)
}

/**
 * @param db The Baqend instance.
 * @param wpt The data to choose the FMP of.
 * @param testId The id of the test to choose the FMP for.
 * @param runIndex The index of the run to choose the FMP for.
 */
export async function chooseFMP(db: baqend, wpt: WptView, testId: string, runIndex: string): Promise<number|null> {
  const wptMetric = getWPTMetric(wpt)
  try {
    db.log.info('Start FMP validation', {wptMetric})
    const data = await prepareData(db, testId, runIndex)

    if (wptMetric > 0 && isWPTMetricValid(db, wptMetric, data)) {
      db.log.info('FMP from WPT is valid', {wptMetric})
      return wptMetric
    }

    const calculatedFMP = calculateFMP(data)
    db.log.info('FMP from WPT is not valid. FMP calculation successful', {calculatedFMP})
    return Math.abs(calculatedFMP - wptMetric) <= 100 ? wptMetric : calculatedFMP
  } catch (error) {
    db.log.warn(`Could not calculate FMP for test ${testId}. Use FMP from wepPageTest instead!`, { error: error.stack })
    return wptMetric > 0 ? wptMetric : null
  }
}
