import { baqend, model } from 'baqend'
import WebPageTest, { TestStatus } from 'webpagetest'
import { sleep } from './_sleep'
import credentials from './credentials'
import fetch from 'node-fetch'
import FormData from 'form-data'

const PING_BACK_URL = `https://${credentials.app}.app.baqend.com/v1/code/testPingback`

export interface WptResult<T> {
  data: T
}

export interface WptRequest {
  url: string
  full_url: string
  request_type: string
  host: string
  priority: string
  responseCode: number
  protocol?: string
  headers: { response: string[] }
}

export interface WptDomain {
  bytes: number
  requests: number
  cdn_provider: string
  connections: number
}

export interface WPTViewport {
  width: number
  dpr: number
  height: number
}

export interface WptView {
  domains: { [domainName: string]: WptDomain }
  lastVisualChange: number
  TTFB: number
  domContentLoadedEventStart: number
  loadEventStart: number
  loadTime: number
  fullyLoaded: number
  firstPaint: number
  firstMeaningfulPaint: number
  domElements: number
  render: number
  SpeedIndex: number
  requests: WptRequest[]
  bytesIn: number
  base_page_cdn: string
  visualComplete85: number
  visualComplete90: number
  visualComplete95: number
  visualComplete99: number
  visualComplete: number
  chromeUserTiming?: Array<{ name: string, time: number }>
  numSteps: number
  viewport: WPTViewport
}

export interface Technology {
  name: string;
  confidence: number;
}
export interface WptStepView extends WptView {
  detected_technologies: { [technology: string]: Technology };
  steps?: WptView[]
  speedKit?: string // SpeedKit config
  serviceWorker?: string
}

export interface WptRun {
  firstView: WptStepView
  repeatView?: WptStepView
}

export interface WptTestResult {
  url: string
  id: string
  runs: { [id: string]: WptRun }
  location: string
  testUrl: string
  summary: string
}

export interface WptTestResultOptions {
  requests: boolean
  breakdown: boolean
  domains: boolean
  pageSpeed: boolean
}

export class Pagetest {
  private wpt: WebPageTest
  private testResolver: Map<string, Function>
  private testRejecter: Map<string, Function>
  private waitPromises: Map<string, Promise<string>>

  constructor() {
    this.wpt = new WebPageTest(credentials.wpt_dns, credentials.wpt_api_key)
    this.testResolver = new Map()
    this.testRejecter = new Map()
    this.waitPromises = new Map()
  }

  /**
   * Queues a new test run of the given url with the given options.
   *
   * @param {string} testScriptOrUrl The URL under test or a test script.
   * @param {object} options The options of this test (see https://github.com/marcelduran/webpagetest-api).
   * @param db Baqend database instance
   * @returns {Promise<TestResult>} A promise of the test
   */
  runTest(testScriptOrUrl: string, options: any, db: baqend) {
    return this.runTestWithoutWait(testScriptOrUrl, options)
      .then(testId => this.waitOnTest(testId, db))
  }

  /**
   * Runs a WebpageTest without waiting for the result.
   *
   * @param testScript The test script under test.
   * @param options The options to pass to WPT.
   * @return A promise resolving with the queued test's ID.
   */
  async runTestWithoutWait(testScript: string, options: model.TestOptions): Promise<string> {
    const opts = Object.assign({ pingback: PING_BACK_URL }, options)
    const result = await this.startTestManually(testScript, opts)
    if (!result.data) {
      throw new Error('Received no test id from WPT')
    }

    const { testId } = result.data

    this.waitPromises.set(testId, new Promise((nestedResolve, nestedReject) => {
      this.testResolver.set(testId, nestedResolve)
      this.testRejecter.set(testId, nestedReject)
    }))

    return testId
  }

  /**
   * Waits for a test to complete.
   *
   * @param {string} testId The ID of the test to wait for.
   * @param db The Baqend instance.
   * @return {Promise<string>} A promise resolving with the test ID when the test is finished.
   */
  waitOnTest(testId: string, db: baqend): Promise<string> {
    this.pingFallback(testId, db)

    const result = this.waitPromises.get(testId)!
    this.waitPromises.delete(testId)

    return result
  }

  /**
   * @param db The Baqend instance.
   * @param {string} testId The ID of the test to resolve.
   */
  resolveTest(db: baqend, testId: string) {
    if (this.testResolver.has(testId)) {
      db.log.info(`Resolver found for test: ${testId}`)
      this.testResolver.get(testId)!.call(null, testId)
      this.testResolver.delete(testId)
      this.testRejecter.delete(testId)
    } else {
      db.log.info(`No resolver for test: ${testId}`)
    }
  }

  /**
   * Cancels a given WebPageTest.
   */
  cancelTest(testId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.wpt.cancelTest(testId, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * @param db The Baqend instance.
   * @param {string} testId The ID of the test to reject.
   * @param data
   * @private
   */
  private rejectTest(db: baqend, testId: string, data: any) {
    if (this.testRejecter.has(testId)) {
      db.log.warn(`Rejecter found for test: ${testId}`, data);
      this.testRejecter.get(testId)!.call(null, new Error(`Test rejected for testId: ${testId}`))
      this.testResolver.delete(testId)
      this.testRejecter.delete(testId)
    }
  }

  /**
   * @param {string} testId
   * @param db The Baqend instance.
   * @private
   */
  private pingFallback(testId: string, db: baqend) {
    let executionCount = 0
    const interval = setInterval(() => {
      if (executionCount >= 10) {
        clearInterval(interval)
      }

      this.getTestStatus(testId).then(({ statusCode }) => {
        // 4XX status code indicates some error
        if (!statusCode || statusCode >= 400) {
          this.rejectTest(db, testId, { statusCode })
          clearInterval(interval)
          return
        }

        // 200 indicates test is completed
        if (statusCode === 200) {
          db.TestResult.find().equal('testId', testId).singleResult((testResult: model.TestResult) => {
            if (!testResult || !testResult.firstView) {
              this.resolveTest(db, testId)
            }
            clearInterval(interval)
          })
        }
      })
      executionCount += 1
    }, 120000)
  }

  /**
   * Returns the current test status of the queued test.
   *
   * @param {string} testId The ID of the test.
   * @returns A status result containing a 'statusCode' which is
   * 101 for waiting
   * 100 for running
   * 200 for completed
   */
  getTestStatus(testId: string): Promise<TestStatus> {
    return new Promise((resolve, reject) => {
      this.wpt.getTestStatus(testId, {}, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Returns the result of a completed test. Precondition: the test must be completed
   *
   * @param testId The ID of the test.
   * @param options The options on what results to return.
   * @returns The result of the test.
   */
  async getTestResults(testId: string, options: Partial<WptTestResultOptions>): Promise<WptResult<WptTestResult>> {
    // Make the result call more reliable
    const result = await this.wptGetTestResults(testId, options)
    const view = result.data.runs['1'].firstView
    const step = view ? (view.steps ? view.steps[view.numSteps - 1] : view) : null

    const firstMissing = !step || step.lastVisualChange <= 0
    if (!firstMissing) {
      return result
    }

    // Retry after 500 milliseconds
    await sleep(500)
    return this.wptGetTestResults(testId, options)
  }

  /**
   * Creates a video and returns the ID.
   *
   * @param testId The ID of the test.
   * @param run The index of the run.
   * @param view The index of the view.
   * @param step The index of the step.
   * @returns Return the video ID or null, if it not exists.
   */
  createVideo(testId: string, run: number, view: number, step: number): Promise<string> {
    const video = `${testId}-r:${run}-c:${view}-s:${step}`
    const videoCreation: Promise<string> = new Promise((resolve, reject) => {
      this.wpt.createVideo(video, {}, (err, result) => {
        if (err || !result.data || !result.data.videoId) {
          return reject('Could not create video id by wpt package')
        }

        resolve(result.data.videoId)
      })
    });

    // if we could not get the video it is because the wpt master sends a redirect
    // since the wpt api cannot cope with that, we have to get the video id manually
    return videoCreation.catch(err => {
      return fetch(`${credentials.wpt_dns}/video/video.php?tests=${video}`, { redirect: 'manual'})
        .then(res => {
          const location = res.headers.get('location');
          if (!location) {
            return ''
          }

          const match = location.match(/video\/(.*)\.mp4/)
          return match ? match[1] : ''
        });
    });
  }

  /**
   * Returns the embed video URL.
   *
   * TODO: This method seems not be used anywhere.
   *
   * @param videoId The video to get the embed for.
   * @returns The video player to embed.
   */
  getEmbedVideoPlayer(videoId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.wpt.getEmbedVideoPlayer(videoId, {}, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Get the test result from WebPageTest for a given ID.
   *
   * @param {string} testId The ID of the test to get the result for.
   * @param {*} options
   * @private
   */
  private wptGetTestResults(testId: string, options: Partial<WptTestResultOptions> = {}): Promise<WptResult<WptTestResult>> {
    return new Promise((resolve, reject) => {
      this.wpt.getTestResults(testId, options, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  private async startTestManually(testScript: string, options: model.TestOptions): Promise<any> {
    const formData = new FormData()
    formData.append('script', testScript)
    for (const key in options) {
      const value = typeof options[key] === 'boolean' ? (options[key] ? 1 : 0) : options[key]
      formData.append(key, value.toString())
    }

    const url = `${credentials.wpt_dns}/runtest.php?f=json`
    const headers = { 'X-WPT-API-KEY': credentials.wpt_api_key };
    const res = await fetch(url, { headers, method: 'POST', body: formData })
    return await res.json()
  }
}

export const API = new Pagetest()
