import { toFile } from './_toFile'
import { getAdSet } from './_adBlocker'
import credentials from './credentials'
import { API, WptRequest, WptRun, WptTestResult, WptTestResultOptions, WptView } from './_Pagetest'
import { countHits } from './_countHits'
import { getFMPData } from './_getFMPData'
import { baqend, binding, model } from 'baqend'

/**
 * Generates a test result from the given test and returns the updated test database object.
 *
 * @param wptTestId The id of the executed WebPagetest test.
 * @param pendingTest The test database object.
 * @param db The Baqend instance.
 * @return The updated test object containing the test result.
 */
export async function generateTestResult(wptTestId: string, pendingTest: model.TestResult, db: baqend): Promise<model.TestResult> {
  db.log.info(`Generating test result: ${wptTestId}`, { test: pendingTest.id, wptTestId })

  if (pendingTest.hasFinished) {
    db.log.warn(`Test was already finished: ${wptTestId}`)
    return pendingTest
  }

  const rawData = await getResultRawData(wptTestId)
  pendingTest.location = rawData.location
  pendingTest.url = rawData.testUrl
  pendingTest.summaryUrl = rawData.summary
  pendingTest.testDataMissing = false

  if (!isValidRun(rawData.runs['1'])) {
    const run = new db.Run()
    const firstView = rawData.runs['1'].firstView
    run.documentRequestFailed = firstView && hasDocumentRequestFailed(firstView.requests)
    pendingTest.firstView = run;

    throw new Error(`No valid test run found in ${rawData.id}`)
  }

  const [testResult, videos] = await Promise.all([
    createTestResult(db, rawData, wptTestId, rawData.testUrl, '1'),
    createVideos(db, wptTestId, '1'),
  ])

  // Copy view data
  const [firstView, repeatView] = testResult
  pendingTest.firstView = firstView
  pendingTest.repeatView = repeatView

  // Copy video data
  const [videoFirstView, videoRepeatView] = videos
  pendingTest.videoFileFirstView = videoFirstView
  pendingTest.videoFileRepeatView = videoRepeatView

  // Now the test is finished with data
  pendingTest.testDataMissing = false

  return pendingTest
}

function getResultRawData(wptTestId: string): Promise<WptTestResult> {
  const options: WptTestResultOptions = {
    requests: true,
    breakdown: false,
    domains: false,
    pageSpeed: false,
  }

  return API.getTestResults(wptTestId, options).then(result => result.data)
}

/**
 * @param db The Baqend instance.
 * @param testId
 * @param runIndex
 */
async function createVideos(db: baqend, testId: string, runIndex: string): Promise<[binding.File, binding.File | null]> {
  db.log.info(`Creating video: ${testId}`)

  const [firstVideo, repeatedVideo] = await Promise.all([
    API.createVideo(testId, runIndex, 0),
    API.createVideo(testId, runIndex, 1),
  ])
  const videoFirstViewPromise = toFile(db, constructVideoLink(testId, firstVideo), `/www/videoFirstView/${testId}.mp4`)

  let videoRepeatViewPromise: Promise<binding.File | null> = Promise.resolve(null)
  if (repeatedVideo) {
    videoRepeatViewPromise = toFile(db, constructVideoLink(testId, repeatedVideo), `/www/videoRepeatView/${testId}.mp4`)
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
 * @param {string} testUrl The url of the test to create the result for.
 * @param {string} runIndex The index of the run to create the result for.
 * @return {Promise} The test result with its views.
 */
function createTestResult(db: baqend, wptData: WptTestResult, testId: string, testUrl: string, runIndex: string): Promise<[model.Run | null, model.Run | null]> {
  const resultRun = wptData.runs[runIndex]

  return Promise.all([
    createRun(db, resultRun.firstView, testId, testUrl, runIndex),
    createRun(db, resultRun.repeatView, testId, testUrl, runIndex),
  ])
}

function isValidRun(run: WptRun): boolean {
  return run.firstView && run.firstView.SpeedIndex > 0 && run.firstView.lastVisualChange > 0
}

/**
 * @param db The Baqend instance.
 * @param {object} data The data to create the run of.
 * @param testId The test id to create the run for.
 * @param testUrl The test url to create the run for.
 * @param runIndex The index of the run to create the run for.
 * @return A promise resolving with the created run.
 */
async function createRun(db: baqend, data: WptView | undefined, testId: string, testUrl: string, runIndex: string): Promise<model.Run | null> {
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
  run.contentSize = new db.ContentSize(countContentSize(data.requests))
  // Document request can not be failed if this code is executed because of validity check
  run.documentRequestFailed = false
  run.basePageCDN = data.base_page_cdn
  run.largestContentfulPaint = getLCPFromWebPagetest(data)

  // Set visual completeness
  const completeness = new db.Completeness()
  completeness.p85 = data.visualComplete85
  completeness.p90 = data.visualComplete90
  completeness.p95 = data.visualComplete95
  completeness.p99 = data.visualComplete99
  completeness.p100 = data.visualComplete
  run.visualCompleteness = completeness

  const [FMPData, domains] = await Promise.all([getFMPData(db, data, testId, runIndex), createDomainList(data)])
  run.fmpData = FMPData
  run.domains = domains

  return run
}

/**
 * Checks whether the document request failed.
 *
 * @param requests An array of request objects.
 */
function hasDocumentRequestFailed(requests: WptRequest[]): boolean {
  const firstDocument = requests.find((req) => {
    const requestUrl = req.url
    const servedByBaqend = req.headers.response.indexOf('via: baqend') !== -1
    if (!requestUrl || !servedByBaqend) {
      return false;
    }

    return requestUrl.startsWith('/v1/asset/')
  })

  return firstDocument ? firstDocument.responseCode >= 400 : false;
}

/**
 * Creates an object including the size in bytes of text and image resources.
 *
 * @param requests An array of request objects.
 */
function countContentSize(requests: any[]): any {
  const contentSize = {
    text: 0,
    images: 0,
  }

  requests.forEach(req => {
    const contentType: string = req.contentType
    const objectSize: number = req.objectSize
    if (!contentType) {
      return
    }

    if (contentType.indexOf('text/') !== -1) {
      contentSize.text += objectSize || 0
    } else if (contentType.indexOf('image/') !== -1) {
      contentSize.images += calculateFastlyImageSize(req)
    }
  });

  return contentSize
}

/**
 * Finds fastly io information in Header.
 *
 * @param header Header entry to check for fastly-io-info.
 */
function findFastlyHeaders(header: string): boolean {
  return !!header.match(/^fastly-io-info/)
}

/**
 * Calculates the difference of the input file size (after optimization) and output file size (before optimization).
 *
 * @param req Request object.
 */
function calculateFastlyImageSize(req: any): number {
  const headers: Array<string> = req.headers.response

  // can't convert to Headers object, therefore we need to find in the array
  const fastlyHeaders = headers.find(findFastlyHeaders)
  if (!fastlyHeaders) {
    return 0
  }

  const fastlyHeader = fastlyHeaders.split(': ')
  const match = fastlyHeader[1].match(/ifsz=(\d*).*ofsz=(\d*)/)

  if (!match) {
    return 0
  }

  const inputFileSize = parseInt(match[1])
  const outputFileSize = parseInt(match[2])

  return inputFileSize - outputFileSize
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
 * Gets the LCP calculated by WebPagetest.
 */
function getLCPFromWebPagetest(data: WptView): number {
  // Search Largest Contentful Paint from timing
  const { chromeUserTiming = [] } = data
  const largestContentfulPaintObject =
    chromeUserTiming
      .reverse()
      .find(entry => entry.name === 'LargestContentfulPaint')

  return largestContentfulPaintObject ? largestContentfulPaintObject.time : 0
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
