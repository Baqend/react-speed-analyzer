import { toFile } from './download'
import { getAdSet } from './adBlocker'
import credentials from './credentials'
import { timeout } from './sleep'
import { API, WptRun, WptTestResult, WptTestResultOptions, WptView } from './Pagetest'
import { countHits } from './countHits'
import fetch from 'node-fetch'
import { getFMP } from './calculateFMP'
import { baqend, binding, model } from 'baqend'

/**
 * Generates a test result from the given test and returns the updated test database object.
 *
 * @param testId The id of the executed test.
 * @param pendingTest The test database object.
 * @param db The Baqend instance.
 * @return The updated test object containing the test result.
 */
export async function generateTestResult(testId: string, pendingTest: model.TestResult, db: baqend): Promise<model.TestResult> {
  db.log.info(`Generating test result: ${testId}`, { testResult: pendingTest.id, testId })

  if (pendingTest.hasFinished) {
    db.log.info(`Result already exists: ${testId}`)
    return pendingTest
  }

  try {
    const rawData = await getResultRawData(testId)
    pendingTest.location = rawData.location
    pendingTest.url = rawData.testUrl
    pendingTest.summaryUrl = rawData.summary
    pendingTest.testDataMissing = false

    const runIndex = getValidTestRun(db, rawData, pendingTest.id)
    const [testResult, videos] = await Promise.all([
      createTestResult(db, rawData, testId, runIndex),
      createVideos(db, testId, runIndex),
    ])

    const [firstView, repeatView] = testResult
    const [videoFirstView, videoRepeatView] = videos

    pendingTest.firstView = firstView
    pendingTest.repeatView = repeatView

    db.log.info(`Videos created: ${testId}`)
    pendingTest.videoFileFirstView = videoFirstView
    pendingTest.videoFileRepeatView = videoRepeatView

    pendingTest.hasFinished = true
    await pendingTest.ready()
    return pendingTest.save()
  } catch (error) {
    db.log.error(`Generating test result failed: ${testId}`,
      { testResult: pendingTest.id, testId, error: error.stack })
    pendingTest.testDataMissing = true
    pendingTest.hasFinished = true

    return pendingTest.ready().then(() => pendingTest.save())
  }
}

function getResultRawData(testId: string): Promise<WptTestResult> {
  const options: WptTestResultOptions = {
    requests: true,
    breakdown: false,
    domains: false,
    pageSpeed: false,
  };

  return API.getTestResults(testId, options).then(result => result.data);
}

/**
 *  @param db The Baqend instance.
 * @param testId
 * @param runIndex
 */
async function createVideos(db: baqend, testId: string, runIndex: string): Promise<[binding.File, binding.File | null]> {
  db.log.info(`Creating video: ${testId}`)

  const videoFirst = API.createVideo(testId, runIndex, 0)
  const videoRepeat = API.createVideo(testId, runIndex, 1)

  const [firstVideoResult, repeatedVideoResult] = await Promise.all([videoFirst, videoRepeat])
  const videoFirstViewPromise = toFile(db, constructVideoLink(testId, firstVideoResult), `/www/videoFirstView/${testId}.mp4`)

  let videoRepeatViewPromise: Promise<binding.File | null> = Promise.resolve(null)
  if (repeatedVideoResult) {
    videoRepeatViewPromise = toFile(db, constructVideoLink(testId, repeatedVideoResult), `/www/videoRepeatView/${testId}.mp4`)
  }

  return Promise.all([videoFirstViewPromise, videoRepeatViewPromise])
}

/**
 * @param testId
 * @param videoId
 * @return
 */
function constructVideoLink(testId: string, videoId: string): string {
  const date = `${testId.substr(0, 2)}/${testId.substr(2, 2)}/${testId.substr(4, 2)}`
  const videoLink = videoId.substr(videoId.indexOf('_') + 1, videoId.length)

  return `http://${credentials.wpt_dns}/results/video/${date}/${videoLink}/video.mp4`
}

/**
 * Creates the test result and returns which run was used for that.
 *
 * @param db The Baqend instance.
 * @param wptData The data from the WPT test.
 * @param testId The id of the test to create the result for.
 * @param {string} runIndex The index of the run to create the result for.
 * @return {Promise} The test result with its views.
 */
function createTestResult(db: baqend, wptData: WptTestResult, testId: string, runIndex: string): Promise<[model.Run | null, model.Run | null]> {
  const resultRun = wptData.runs[runIndex]

  return Promise.all([
    createRun(db, resultRun.firstView, testId, runIndex),
    createRun(db, resultRun.repeatView, testId, runIndex)
  ])
}

function isValidRun(run: WptRun): boolean {
  return run.firstView && run.firstView.SpeedIndex > 0 && run.firstView.lastVisualChange > 0
}


function getValidTestRun(db: baqend, wptData: WptTestResult, testId: string): string {
  const runIndex = Object.keys(wptData.runs).find(index => isValidRun(wptData.runs[index]))
  db.log.info(`Choosing run ${runIndex}`, { runs: Object.keys(wptData.runs) })

  if (!runIndex) {
    db.log.error(`No valid test run`, { testResult: testId, wptData })
    throw new Error(`No valid test run found: ${wptData.id}`)
  }

  return runIndex
}

/**
 * @param db The Baqend instance.
 * @param {object} data The data to create the run of.
 * @param testId The test id to create the run for.
 * @param runIndex The index of the run to create the run for.
 * @return A promise resolving with the created run.
 */
async function createRun(db: baqend, data: WptView | undefined, testId: string, runIndex: string): Promise<model.Run | null> {
  if (!data) {
    return null
  }

  const run = new db.Run()

  // Copy fields
  const fields: Array<keyof WptView> = ['loadTime', 'fullyLoaded', 'firstPaint', 'lastVisualChange', 'domElements']
  for (const field of fields) {
    run[field] = Math.round(data[field] as number)
  }

  // Set TTFB
  run.ttfb = data.TTFB

  // Set other
  run.domLoaded = data.domContentLoadedEventStart
  run.load = data.loadEventStart
  run.startRender = data.render
  run.speedIndex = data.SpeedIndex
  run.requests = data.requests.length
  run.failedRequests = countFailedRequests(data)
  run.bytes = data.bytesIn
  run.hits = new db.Hits(countHits(data.requests))
  run.basePageCDN = data.base_page_cdn

  // Set visual completeness
  const completeness = new db.Completeness()
  completeness.p85 = data.visualComplete85
  completeness.p90 = data.visualComplete90
  completeness.p95 = data.visualComplete95
  completeness.p99 = data.visualComplete99
  completeness.p100 = data.visualComplete
  run.visualCompleteness = completeness

  const [firstMeaningfulPaint, domains] = await Promise.all([chooseFMP(db, data, testId, runIndex), createDomainList(data)])
  run.firstMeaningfulPaint = firstMeaningfulPaint
  run.domains = domains

  return run
}

/**
 * @param db The Baqend instance.
 * @param data The data to choose the FMP of.
 * @param testId The id of the test to choose the FMP for.
 * @param runIndex The index of the run to choose the FMP for.
 */
async function chooseFMP(db: baqend, data: WptView, testId: string, runIndex: string): Promise<number> {
  try {
    return await getFMP(testId, runIndex)
  } catch (error) {
    db.log.warn(`Could not calculate FMP for test ${testId}. Use FMP from wepPageTest instead!`, { error: error.stack })

    // Search First Meaningful Paint from timing
    const { chromeUserTiming = [] } = data
    const firstMeaningfulPaintObject =
      chromeUserTiming
        .reverse()
        .find(entry => entry.name === 'firstMeaningfulPaint' || entry.name === 'firstMeaningfulPaintCandidate')

    return firstMeaningfulPaintObject ? firstMeaningfulPaintObject.time : 0
  }
}

/**
 * Counts all failed requests in a WPT view.
 */
function countFailedRequests(data: WptView): number {
  return data.requests.reduce((previous, request) => request.responseCode >= 400 ? previous + 1 : previous, 0)
}

/**
 * Creates an array of domains being found in a WPT view.
 */
async function createDomainList(data: WptView): Promise<model.Domain[]> {
  try {
    const adSet = await getAdSet()
    const domains: model.Domain[] = []
    for (const domainName in data.domains) {
      const domainObject: Partial<model.Domain> = data.domains[domainName]
      domainObject.isAdDomain = isAdDomain(domainName, adSet)
      domainObject.url = domainName

      domains.push(domainObject as model.Domain)
    }

    return domains
  } catch (e) {
    return []
  }
}

/**
 * @param {string} url
 * @param {Set<string>} adSet
 * @return {boolean}
 */
function isAdDomain(url: string, adSet: Set<string>): boolean {
  const index = url.indexOf('.')
  if (index === -1) {
    return false
  }

  if (adSet.has(url)) {
    return true
  }

  return isAdDomain(url.substr(index + 1), adSet)
}
