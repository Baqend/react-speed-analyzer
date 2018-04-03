import WebPageTest from 'webpagetest';
import credentials from './credentials';
const { sleep } = require('./sleep');

const PING_BACK_URL = `https://${credentials.app}.app.baqend.com/v1/code/testPingback`;

export interface WptResult<T> {
  data: T
}

export interface WptView {
  lastVisualChange: number
}

export interface WptRun {
  firstView: WptView
  repeatView?: WptView
}

export interface WptTestResult {
  runs: { [id: string]: WptRun }
  location: string
  testUrl: string
  summary: string
}

class Pagetest {
  private wpt: WebPageTest
  private testResolver: Map<string, Function>
  private testRejecter: Map<string, Function>
  private waitPromises: Map<string, Promise<string>>

  /**
   * @param {string} wptEndpoint WebpageTest's URL endpoint.
   * @param {string} wptApiKey WebpageTest's API key.
   */
  constructor(wptEndpoint: string, wptApiKey: string) {
    /**
     * @type {WebPageTest}
     */
    this.wpt = new WebPageTest(wptEndpoint, wptApiKey);

    /**
     * @type {Map<string, Function>}
     */
    this.testResolver = new Map();

    /**
     * @type {Map<string, Function>}
     */
    this.testRejecter = new Map();

    /**
     * @type {Map<string, Promise>}
     */
    this.waitPromises = new Map();
  }

  /**
   * Queues a new test run of the given url with the given options.
   *
   * @param {string} testScriptOrUrl The URL under test or a test script.
   * @param {object} options The options of this test (see https://github.com/marcelduran/webpagetest-api).
   * @param db Baqend database instance
   * @returns {Promise<TestResult>} A promise of the test
   */
  runTest(testScriptOrUrl: string, options: any, db) {
    return this.runTestWithoutWait(testScriptOrUrl, options)
      .then(testId => this.waitOnTest(testId, db));
  }

  /**
   * Runs a WebpageTest without waiting for the result.
   *
   * @param {string} testScriptOrUrl The URL under test or a test script.
   * @param {object} options The options to pass to WPT.
   * @return {Promise<string>} A promise resolving with the queued test's ID.
   */
  runTestWithoutWait(testScriptOrUrl: string, options: any = {}): Promise<string> {
    const opts = Object.assign({ pingback: PING_BACK_URL }, options);

    return new Promise((resolve, reject) => {
      this.wpt.runTest(testScriptOrUrl, opts, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        if (!result.data) {
          reject(new Error('Received no test id from WPT'));
          return;
        }

        const { testId } = result.data;
        this.waitPromises.set(testId, new Promise((nestedResolve, nestedReject) => {
          this.testResolver.set(testId, nestedResolve);
          this.testRejecter.set(testId, nestedReject);
        }));

        resolve(testId);
      });
    });
  }

  /**
   * Waits for a test to complete.
   *
   * @param {string} testId The ID of the test to wait for.
   * @param db
   * @return {Promise<string>} A promise resolving with the test ID when the test is finished.
   */
  waitOnTest(testId: string, db): Promise<string> {
    this.pingFallback(testId, db);

    const result = this.waitPromises.get(testId);
    this.waitPromises.delete(testId);

    return result;
  }

  /**
   * @param db
   * @param {string} testId The ID of the test to resolve.
   */
  resolveTest(db, testId: string) {
    if (this.testResolver.has(testId)) {
      db.log.info(`Resolver found for test: ${testId}`);
      this.testResolver.get(testId).call(null, testId);
      this.testResolver.delete(testId);
      this.testRejecter.delete(testId);
    } else {
      db.log.info(`No resolver for test: ${testId}`);
    }
  }

  /**
   * @param {string} testId The ID of the test to reject.
   * @private
   */
  rejectTest(testId: string) {
    if (this.testRejecter.has(testId)) {
      this.testRejecter.get(testId).call(null, new Error(`Test rejected for testId: ${testId}`));
      this.testResolver.delete(testId);
      this.testRejecter.delete(testId);
    }
  }

  /**
   * @param {string} testId
   * @param db
   * @private
   */
  pingFallback(testId: string, db) {
    let executionCount = 0
    const interval = setInterval(() => {
      if (executionCount >= 10) {
        clearInterval(interval)
      }

      this.getTestStatus(testId).then(({ statusCode }) => {
        // 4XX status code indicates some error
        if (!statusCode || statusCode >= 400) {
          this.rejectTest(testId)
          clearInterval(interval)
          return
        }

        // 200 indicates test is completed
        if (statusCode === 200) {
          db.TestResult.find().equal('testId', testId).singleResult((testResult) => {
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
  getTestStatus(testId: string): Promise<{ statusCode: number }> {
    return new Promise((resolve, reject) => {
      this.wpt.getTestStatus(testId, {}, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Returns the result of a completed test. Precondition: the test must be completed
   *
   * @param {string} testId The ID of the test.
   * @param options The options on what results to return.
   * @returns {Promise} The result of the test.
   */
  getTestResults(testId: string, options: any): Promise<WptResult<WptTestResult>> {
    // Make the result call more reliable
    return this.wptGetTestResults(testId, options)
      .then((result) => {
        const firstMissing = result.data.runs['1'].firstView.lastVisualChange <= 0;
        const secondMissing = result.data.runs['1'].repeatView && result.data.runs['1'].repeatView.lastVisualChange <= 0;

        if (!firstMissing && !secondMissing) {
          return result;
        }

        // Retry after 500 milliseconds
        return sleep(500).then(() => this.wptGetTestResults(testId, options));
      });
  }

  /**
   * Get the test result from WebPageTest for a given ID.
   *
   * @param {string} testId The ID of the test to get the result for.
   * @param {*} options
   * @private
   */
  private wptGetTestResults(testId: string, options: any = {}): Promise<WptResult<WptTestResult>> {
    return new Promise((resolve, reject) => {
      this.wpt.getTestResults(testId, options, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Creates a video and returns the ID.
   *
   * @param {string} testId The ID of the test.
   * @param {number} run The index of the run.
   * @param {number} view The index of the view.
   * @returns {Promise<string|null>} Return the video ID or null, if it not exists.
   */
  createVideo(testId: string, run: number, view: number): Promise<string | null> {
    const video = `${testId}-r:${run}-c:${view}`;
    return new Promise((resolve, reject) => {
      this.wpt.createVideo(video, {}, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.data && result.data.videoId || null);
        }
      });
    });
  }

  /**
   * Returns the embed video URL.
   *
   * TODO: This method seems not be used anywhere.
   *
   * @param {string} videoId The video to get the embed for.
   * @returns {Promise}
   */
  getEmbedVideoPlayer(videoId) {
    return new Promise((resolve, reject) => {
      this.wpt.getEmbedVideoPlayer(videoId, {}, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

export const API = new Pagetest(credentials.wpt_dns, credentials.wpt_api_key)
