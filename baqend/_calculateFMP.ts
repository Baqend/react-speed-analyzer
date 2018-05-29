import { baqend } from 'baqend'
import fetch from 'node-fetch'
import { WptView } from './_Pagetest'
import credentials from './credentials'

interface Delta {
  deltaVC: number
  time: number
}

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

/**
 * Gets the FMP calculated by WebPagetest.
 */
function getFMPFromWebPagetest(data: WptView): number {
  // Search First Meaningful Paint from timing
  const { chromeUserTiming = [] } = data
  const firstMeaningfulPaintObject =
    chromeUserTiming
      .reverse()
      .find(entry => entry.name === 'firstMeaningfulPaint' || entry.name === 'firstMeaningfulPaintCandidate')

  return firstMeaningfulPaintObject ? firstMeaningfulPaintObject.time : 0
}

/**
 * Calculates the first deviation of the given data.
 */
function firstDeviation(data: Array<[number, number]>): Delta[] {
  const diffs = [] as Delta[]
  if (data.length === 1) {
    return [{ deltaVC: data[0][1], time: data[0][0] }]
  }

  let lastVisualProgress = data[0][1]
  for (let i = 1; i < data.length; i += 1) {
    const [time, visualProgress] = data[i]
    const diff = visualProgress - lastVisualProgress
    lastVisualProgress = visualProgress

    diffs.push({ deltaVC: diff, time })
  }

  return diffs
}

/**
 * Calculates ΔVisualCompleteness from the WebPagetest
 */
async function prepareDeltas(db: baqend, testId: string, runIndex: string): Promise<Delta[]> {
  const url = `http://${credentials.wpt_dns}/video/compare.php?tests=${testId}-r:${runIndex}-c:0`
  const response = await fetch(url)
  const htmlString = await response.text()
  const data = getDataFromHtml(htmlString)
  db.log.info('Found data for FMP calculation', { data })

  return firstDeviation(data)
}

/**
 * Checks whether the FMP calculated by WebPagetest is valid and should be taken.
 */
function isWebPagetestFMPValid(db: baqend, wptFMP: number, deltas: Delta[]): boolean {
  if (deltas.length === 1) {
    const { time } = deltas[0]
    return Math.abs(time * 1000 - wptFMP) <= 100
  }

  // Find the three highest ΔVCs
  const highestDeltas = deltas
    .sort(({ deltaVC: a }, { deltaVC: b }) => b - a)
    .slice(0, 3)

  db.log.info('Candidates for FMP found', { highestDeltas })
  return highestDeltas.some(candidate => Math.abs(candidate.time * 1000 - wptFMP) <= 100)
}

/**
 * Calculate first meaningful paint based on the given data.
 *
 * @param deltas An Array of visual progress raw data.
 * @return The first meaningful paint value.
 */
function calculateFMPFromData(deltas: Delta[]): number {
  let firstMeaningfulPaint = 0
  let highestDelta = 0

  if (deltas.length === 1) {
    return deltas[0].time * 1000
  }

  for (let i = 1; i < deltas.length; i += 1) {
    const { deltaVC, time } = deltas[i]

    // stop loop if the visual progress is negative => FMP is last highest diff
    if (deltaVC < 0) {
      break
    }

    // The current diff is the highest and the visual progress is at least 50%
    if (deltaVC > highestDelta) {
      highestDelta = deltaVC
      firstMeaningfulPaint = time
    }

    if (highestDelta >= 50) {
      break
    }
  }

  return firstMeaningfulPaint * 1000
}

/**
 * @param db The Baqend instance.
 * @param wpt The data to calculate the FMP of.
 * @param testId The ID of the test to calculate the FMP for.
 * @param runIndex The run index to calculate the FMP for.
 */
export async function calculateFMP(db: baqend, wpt: WptView, testId: string, runIndex: string): Promise<number | null> {
  const wptFMP = getFMPFromWebPagetest(wpt)
  try {
    db.log.info('Start FMP validation', { wptFMP })

    // Calculate the ΔVCs
    const deltas = await prepareDeltas(db, testId, runIndex)

    if (wptFMP > 0 && isWebPagetestFMPValid(db, wptFMP, deltas)) {
      db.log.info('FMP from WPT is valid', { wptFMP })
      return wptFMP
    }

    const calculatedFMP = calculateFMPFromData(deltas)
    db.log.info('FMP from WPT is not valid. FMP calculation successful', { calculatedFMP })
    return Math.abs(calculatedFMP - wptFMP) <= 100 ? wptFMP : calculatedFMP
  } catch (error) {
    db.log.warn(`Could not calculate FMP for test ${testId}. Use FMP from wepPageTest instead!`, { error: error.stack })
    return wptFMP > 0 ? wptFMP : null
  }
}
