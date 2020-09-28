import { baqend, model } from 'baqend'
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
  const regex = /google\.visualization\.arrayToDataTable\((\[(.|\n)*?])\);/gm
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
function parseCandidates(db: baqend, data: Array<[number, number]>): model.Candidate[] {
  const diffs = [] as model.Candidate[]
  if (data.length === 1) {
    const candidate: model.Candidate = new db.Candidate()
    candidate.visualCompleteness = 100
    candidate.deltaVC = data[0][1]
    candidate.startTime = 0
    candidate.endTime = Math.round(data[0][0] * 1000)
    candidate.wptFMP = null
    diffs.push(candidate)
    return diffs
  }

  let lastVisualProgress = 0
  for (let i = 0; i < data.length; i += 1) {
    const [time, visualProgress] = data[i]
    const diff = visualProgress - lastVisualProgress
    lastVisualProgress = visualProgress

    const candidate = new db.Candidate()
    candidate.visualCompleteness = visualProgress
    candidate.deltaVC = diff
    candidate.startTime = Math.round(time * 1000 - 100)
    candidate.endTime = Math.round(time * 1000)
    candidate.wptFMP = null
    diffs.push(candidate)
  }

  return diffs
}

/**
 * Calculates ΔVisualCompleteness from the WebPagetest
 */
async function prepareCandidates(db: baqend, testId: string, runIndex: string): Promise<model.Candidate[]> {
  const url = `http://${credentials.wpt_dns}/video/compare.php?tests=${testId}-r:${runIndex}-c:0`
  const response = await fetch(url)
  const htmlString = await response.text()
  const data = getDataFromHtml(htmlString)
  db.log.info('Found data for FMP calculation', { data })

  return parseCandidates(db, data)
}

/**
 * Chooses up to five candidates based on the given deltas.
 */
function chooseTopCandidates(db: baqend, candidates: model.Candidate[]): model.Candidate[] {
  // Find the five highest ΔVCs
  const topCandidates = candidates
    .filter((candidate) => candidate.visualCompleteness > 0)
    .filter(({ deltaVC }) => deltaVC >= 5)
    .sort(({ deltaVC: a }, { deltaVC: b }) => b - a)
    .slice(0, 10)

  db.log.info('Candidates for FMP found', { topCandidates })
  return topCandidates
}

/**
 * Gets a candidate that matches the WPT FMP or null.
 */
function getMatchingCandidate(wptFMP: number, candidates: model.Candidate[]): model.Candidate|null {
  if (wptFMP <= 0) {
    return null
  }

  const matchingCandidate = candidates.find(candidate => {
    return Math.abs(candidate.startTime - wptFMP) <= 100 ||
      Math.abs(candidate.endTime - wptFMP) <= 100
  })

  return matchingCandidate || null
}

/**
 * Calculates the candidate based on the given deltas.
 */
function chooseSuggestedCandidate(db: baqend, candidates: model.Candidate[], wptFMP: number): model.Candidate {
  const suggestedCandidate = new db.Candidate()
  for(const i in candidates) {
    const { deltaVC } = candidates[i]

    // stop loop if the visual progress is negative => FMP is last highest diff
    if (deltaVC < 0) {
      break
    }

    if (typeof suggestedCandidate.deltaVC === 'undefined' || deltaVC > suggestedCandidate.deltaVC) {
      Object.assign(suggestedCandidate, candidates[i].toJSON())
    }
  }

  if (Math.abs(suggestedCandidate.startTime - wptFMP) <= 100 || Math.abs(suggestedCandidate.endTime - wptFMP) <= 100) {
    suggestedCandidate.wptFMP = wptFMP
  }

  return suggestedCandidate
}

function createFMPData(db: baqend, suggestedCandidate: model.Candidate, candidates: Array<model.Candidate> | null): model.FMPData {
  const fmpData = new db.FMPData()
  fmpData.suggestedCandidate = suggestedCandidate
  fmpData.candidates = candidates
  return fmpData
}

/**
 * @param db The Baqend instance.
 * @param wpt The data to calculate the FMP of.
 * @param testId The ID of the test to calculate the FMP for.
 * @param runIndex The run index to calculate the FMP for.
 */
export async function getFMPData(db: baqend, wpt: WptView, testId: string, runIndex: string): Promise<model.FMPData|null> {
  const wptFMP = getFMPFromWebPagetest(wpt)
  try {
    db.log.info('Start FMP calculation', { wptFMP })

    // Calculate the ΔVCs
    const candidates = await prepareCandidates(db, testId, runIndex)

    const topCandidates = chooseTopCandidates(db, candidates);
    const validCandidate = getMatchingCandidate(wptFMP, topCandidates)
    if (validCandidate) {
      validCandidate.wptFMP = wptFMP
      db.log.info('FMP from WPT is valid with one top candidate', { validCandidate })
      // update valid candidate in candidates
      for (const i in topCandidates) {
        if (topCandidates[i].endTime == validCandidate.endTime) {
          Object.assign(topCandidates[i], validCandidate.toJSON())
          break;
        }
      }

      return createFMPData(db, validCandidate, topCandidates)
    }

    db.log.info('FMP from WPT is not valid with top candidates')
    const calculatedCandidate = chooseSuggestedCandidate(db, candidates, wptFMP)
    db.log.info('Candidate calculated based on all candidates', { calculatedCandidate })
    topCandidates.push(calculatedCandidate)

    return createFMPData(db, calculatedCandidate, topCandidates)
  } catch (error) {
    db.log.warn(`Could not calculate FMP for test ${testId}. Use FMP from wepPageTest instead!`, { error: error.stack })
    if (!wptFMP) {
      return null
    }

    const suggestedCandidate = new db.Candidate()
    suggestedCandidate.wptFMP = wptFMP
    return createFMPData(db, suggestedCandidate, null)
  }
}
