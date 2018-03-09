/* eslint-disable comma-dangle, no-use-before-define, no-restricted-syntax */
/* global Abort */
const DEFAULT_LOCATION = 'eu-central-1:Chrome.Native';
const DEFAULT_ACTIVITY_TIMEOUT = 75;
const DEFAULT_TIMEOUT = 30;

const defaultTestOptions = {
  video: true,
  disableOptimization: true,
  pageSpeed: false,
  requests: false,
  breakDown: false,
  domains: false,
  saveResponseBodies: false,
  tcpDump: false,
  timeline: false,
  minimumDuration: 1, // capture at least one second
  chromeTrace: false,
  netLog: false,
  disableHTTPHeaders: true,
  disableScreenshot: true,
  ignoreSSL: true,
  block: 'favicon', // exclude favicons for fair comparison, as not handled by SWs
  jpegQuality: 100,
  poll: 1, // poll every second
  timeout: 2 * DEFAULT_TIMEOUT,
};

/**
 * Creates a TestResult object, that has all the information needed in order to be processed by the TestWorker
 *
 * @param db The Baqend instance.
 * @param {string} url The URL to test.
 * @param {boolean} isClone True, if this is the cloned page.
 * @param {string} [location] The server location to execute the test.
 * @param {boolean} [caching] True, if browser caching should be used.
 * @param {number} [activityTimeout] The timeout when the test should be aborted.
 * @param {boolean} [isSpeedKitComparison] True, if Speed Kit is already running on the tested site.
 * @param {Object} [speedKitConfig] The speedKit configuration.
 * @param {boolean} [mobile] True, if a mobile-only test should be made.
 * @param {number} [priority=0] Defines the test's priority, from 0 (highest) to 9 (lowest).
 * @return {Promise<TestResult>} A promise resolving when the test has been created.
 */
class TestRequest {
  constructor(db, params) {
    this.db = db
    this.params = params
  }

  create() {
    const params = this.params
    const commandLine = this.createCommandLineFlags(params.url, params.isClone);
    if (commandLine) {
      this.db.log.info('flags: %s', commandLine);
    }

    const testInfo = {
      url: params.url,
      isTestWithSpeedKit: params.isClone,
      isSpeedKitComparison: params.isSpeedKitComparison,
      activityTimeout: params.activityTimeout,
      skipPrewarm: params.skipPrewarm,
      testOptions: Object.assign({}, defaultTestOptions, {
        runs: 2,
        firstViewOnly: !params.caching,
        commandLine: commandLine,
        priority: params.priority || 0,
        location: params.location ? params.location : DEFAULT_LOCATION,
        mobile: params.mobile,
        device: params.mobile ? 'iPhone6' : '',
      }),
    };

    const testResult = new this.db.TestResult({
      url: params.url,
      isClone: params.isClone,
      priority: params.priority,
      speedKitConfig: params.speedKitConfig,
      testInfo: testInfo,
      hasFinished: false,
      webPagetests: []
    })

    return testResult.save()
  }

  /**
   * Creates a string that is used to execute the wpt with some custom commands. If the
   * url is http only it adds an extra flag to inject speedkit into non secure websites
   * @return {string}
   */
  createCommandLineFlags(testUrl, isClone) {
    const http = 'http://';
    if (isClone && testUrl.startsWith(http)) {
      // origin should looks like http://example.com - without any path components
      const end = testUrl.indexOf('/', http.length);
      const origin = testUrl.substring(0, end === -1 ? testUrl.length : end);
      return `--unsafely-treat-insecure-origin-as-secure="${origin}"`;
    }
    return '';
  }
}

exports.TestRequest = TestRequest

const { TestWorker } = require('./_testWorker');

exports.call = function(db, data, req) {
  const params = data
  const testWorker = new TestWorker(db)
  const testRequest = new TestRequest(db, params)

  return testRequest.create().then(testResult => {
    testWorker.next(testResult.id)
    return testResult
  })
};
