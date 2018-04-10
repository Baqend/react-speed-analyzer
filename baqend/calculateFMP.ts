import { baqend } from 'baqend'
import fetch from 'node-fetch'
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

/**
 * Calculate first meaningful paint based on the given data.
 *
 * @param data An Array of visual progress raw data.
 * @return {number} The first meaningful paint value.
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

/**
 * Gets the first meaningful paint for a given test run.
 */
export async function getFMP(testId: string, runIndex: string): Promise<number> {
  const url = `http://${credentials.wpt_dns}/video/compare.php?tests=${testId}-r:${runIndex}-c:0`
  const response = await fetch(url)
  const htmlString = await response.text()
  const data = getDataFromHtml(htmlString)

  return calculateFMP(data)
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, data: { testId: string, runIndex: string }): Promise<{ fmp: number }> {
  const { testId, runIndex = '0' } = data

  try {
    return { fmp: await getFMP(testId, runIndex) }
  } catch (err) {
    throw new Abort(err.message)
  }
}
