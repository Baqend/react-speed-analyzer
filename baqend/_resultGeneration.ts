import { createFilmStrip, generateHash, truncateUrl, urlToFilename } from './_helpers'
import { DataType, Serializer } from './_Serializer'
import { isCanceled } from './_Status'
import { TestError } from './_TestFactory'
import { VIEWPORT_HEIGHT_DESKTOP, VIEWPORT_WIDTH_DESKTOP } from './_TestScriptBuilder'
import { toFile } from './_toFile'
import { getAdSet } from './_adBlocker'
import credentials from './credentials'
import { API, WptRequest, WptTestResult, WptTestResultOptions, WptView } from './_Pagetest'
import { countHits } from './_countHits'
import { getFMPData } from './_getFMPData'
import { baqend, binding, model } from 'baqend'

export class ViewportError extends Error {}

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

  if (pendingTest.hasFinished && !isCanceled(pendingTest)) {
    db.log.warn(`Test was already finished: ${wptTestId}`)
    return pendingTest
  }

  const rawData = await getResultRawData(wptTestId)
  const url = await truncateUrl(rawData.testUrl)

  pendingTest.location = rawData.location
  pendingTest.url = url
  pendingTest.summaryUrl = rawData.summary
  pendingTest.testDataMissing = false

  const view = rawData.runs['1'].firstView

  const stepIndex = view.numSteps
  const step = view ? (view.steps ? view.steps[stepIndex - 1] : view) : null

  if (step && hasDocumentRequestFailed(step.requests, pendingTest.isClone)) {
    const run = new db.Run()
    run.documentRequestFailed = true
    pendingTest.firstView = run;

    throw new Error(TestError.DOCUMENT_FAILED)
  }

  if (!step || !isValidStep(step)) {
    throw new Error(TestError.NO_VALID_TEST)
  }

  const viewport = view.viewport
  const retriesLeft = pendingTest.retries < 2;
  const isDesktop = !pendingTest.testInfo.testOptions.mobile
  const hasViewportError = viewport && (viewport.width !== VIEWPORT_WIDTH_DESKTOP || viewport.height !== VIEWPORT_HEIGHT_DESKTOP)
  if (isDesktop && hasViewportError && retriesLeft) {
    throw new ViewportError(`WPT viewport (${viewport.width} x ${viewport.height}) not equals configured (${VIEWPORT_WIDTH_DESKTOP} x ${VIEWPORT_HEIGHT_DESKTOP})`)
  }

  const [testResult, videos] = await Promise.all([
    createTestResult(db, step, wptTestId, rawData.testUrl, stepIndex),
    createVideos(db, wptTestId, stepIndex),
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

  const wptWaterfall = await createWaterfall(wptTestId, url, isDesktop, db);
  const wptFilmstrip = await createFilmStrip(db, [wptTestId], url, isDesktop);
  pendingTest.wptWaterfall = wptWaterfall;
  pendingTest.wptFilmstrip = wptFilmstrip;

  const technologies = view['detected_technologies']
  if (!!technologies) {
    for (const [, value] of Object.entries(technologies)) {
      if (value.confidence === 100 && value.name !== 'Cart Functionality') {
        pendingTest.framework = value.name
        break
      }
    }
  }

  const controllingSW = view['serviceWorker']
  pendingTest.controllingSW = controllingSW || null

  const speedKitConfig = view['speedKit'];
  if (!pendingTest.isClone && !!speedKitConfig) {
    const serializer = new Serializer()
    const denormalize = serializer.denormalize(speedKitConfig)
    pendingTest.speedKitConfig = serializer.serialize(denormalize, DataType.JAVASCRIPT)
  }

  return pendingTest
}

/**
 * Creates the waterfall screenshot.
 *
 * @param wptTestId The id of the executed WebPagetest test.
 * @param url The url where the file gets saved.
 * @param isDesktop The device type.
 * @param db The Baqend instance.
 * @return A promise resolving with the file created or null.
 */
async function createWaterfall(wptTestId: string, url: string, isDesktop: boolean = true, db:baqend): Promise<binding.File | null> {
  try {
    const device = isDesktop ? 'desktop' : 'mobile'
    const screenshotLink = `${credentials.wpt_dns}/waterfall.php?test=${wptTestId}`;
    return await toFile(db, screenshotLink, `/www/screenshots/${urlToFilename(url)}/${device}/${generateHash()}.jpg`)
  } catch {
    return null;
  }
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
 * @param stepIndex
 */
async function createVideos(db: baqend, testId: string, stepIndex: number): Promise<[binding.File, binding.File | null]> {
  db.log.info(`Creating video: ${testId}`)

  const [firstVideo, repeatedVideo] = await Promise.all([
    API.createVideo(testId, 1, 0, stepIndex),
    API.createVideo(testId, 1, 1, stepIndex),
  ])

  const videoFirstViewPromise = toFile(db, constructVideoLink(firstVideo), `/www/videoFirstView/${testId}.mp4`)

  let videoRepeatViewPromise: Promise<binding.File | null> = Promise.resolve(null)
  if (repeatedVideo) {
    videoRepeatViewPromise = toFile(db, constructVideoLink(repeatedVideo), `/www/videoRepeatView/${testId}.mp4`)
  }

  return Promise.all([videoFirstViewPromise, videoRepeatViewPromise])
}

/**
 * @param videoId
 * @return
 */
function constructVideoLink(videoId: string): string {
  return `${credentials.wpt_dns}/work/video/${videoId}.mp4`
}

/**
 * Creates the test result and returns which run was used for that.
 *
 * @param db The Baqend instance.
 * @param step The data from the WPT test.
 * @param testId The id of the test to create the result for.
 * @param {string} testUrl The url of the test to create the result for.
 * @param {number} stepIndex The index of the step to create the result for.
 * @return {Promise} The test result with its views.
 */
function createTestResult(db: baqend, step: WptView, testId: string, testUrl: string, stepIndex: number): Promise<[model.Run | null, model.Run | null]> {
  return Promise.all([
    createRun(db, step, testId, testUrl, stepIndex),
    createRun(db, step, testId, testUrl, stepIndex),
  ])
}

function isValidStep(step: WptView): boolean {
  return step.SpeedIndex > 0 && step.lastVisualChange > 0
}

/**
 * @param db The Baqend instance.
 * @param {object} data The data to create the run of.
 * @param testId The test id to create the run for.
 * @param testUrl The test url to create the run for.
 * @param stepIndex The index of the step to create the run for.
 * @return A promise resolving with the created run.
 */
async function createRun(db: baqend, data: WptView | undefined, testId: string, testUrl: string, stepIndex: number): Promise<model.Run | null> {
  if (!data) {
    return null
  }

  const run = new db.Run()

  // Copy fields
  const fields: Array<keyof WptView> = ['loadTime', 'fullyLoaded', 'firstPaint', 'lastVisualChange', 'domElements', 'firstMeaningfulPaint']
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
  run.resources = createResourceList(data)

  const [FMPData, domains] = await Promise.all([getFMPData(db, data, testId, stepIndex), createDomainList(data)])
  run.fmpData = FMPData
  run.domains = domains

  return run
}

/**
 * Checks whether the document request failed.
 *
 * @param requests An array of request objects.
 * @param isClone Whether the test is the Speed Kit run.
 */
function hasDocumentRequestFailed(requests: WptRequest[], isClone: boolean): boolean {
  if (!isClone) {
    return (requests.filter(r => r.request_type === 'Document') || requests)[0].responseCode >= 400
  }

  const assetRequests = requests.filter((req) => {
    const requestUrl = req.url
    const servedByBaqend = req.headers.response.indexOf('via: baqend') !== -1
    if (!requestUrl || !servedByBaqend) {
      return false;
    }

    return requestUrl.includes('/v1/asset/')
  })

  // Return false if there are no baqend requests to analyze
  if (!assetRequests.length) {
    return false
  }

  // Return true if the document request was blocked already
  if (assetRequests[0].responseCode >= 400) {
    return true
  }

  // Remove document request
  assetRequests.shift()

  // check if all asset requests were blocked by the origin server
  return !!assetRequests.length && assetRequests.every(req => req.responseCode >= 400)
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
 * Creates an array of resources being requested in a WPT view.
 */
function createResourceList(data: WptView): model.Resource[] {
  const resources: model.Resource[] = []
  for (const request of data.requests) {
    const { url, host, priority, protocol } = request
    resources.push({
      host,
      priority,
      protocol,
      pathname: url,
      url: request.full_url,
      type: request.request_type
    })
  }

  return resources
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
