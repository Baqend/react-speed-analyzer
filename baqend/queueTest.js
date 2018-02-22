/* eslint-disable comma-dangle, no-use-before-define, no-restricted-syntax */
/* global Abort */
const credentials = require('./credentials');
const { isRateLimited } = require('./rateLimiter');
const { executeTest, handleTestError } = require('./testExecution');
const { executePrewarm } = require('./prewarming');

const DEFAULT_LOCATION = 'eu-central-1:Chrome.Native';
const DEFAULT_ACTIVITY_TIMEOUT = 75;
const DEFAULT_TIMEOUT = 30;

exports.call = function callQueueTest(db, data, req) {
  // Check if IP is rate-limited
  if (isRateLimited(req)) {
    throw new Abort({ message: 'Too many requests', status: 429 });
  }

  return queueTest(Object.assign({}, { db }, data))
    .then(testResult => ({ baqendId: testResult.key }));
};

/**
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
 * @param {function} [finish] A callback which will be called when the test succeeds or fails.
 * @return {Promise<TestResult>} A promise resolving when the test has been created.
 */
function queueTest({
  // Required parameters
  db,
  url,
  isClone,
  // Optional parameters
  location = DEFAULT_LOCATION,
  caching = false,
  activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
  isSpeedKitComparison = false,
  speedKitConfig = null,
  mobile = false,
  priority = 0,
  skipPrewarm = false,
  finish = null,
}) {
  const commandLine = createCommandLineFlags(url, isClone);
  if (commandLine) {
    db.log.info('flags: %s', commandLine);
  }
  const runs = 2;
  const testOptions = {
    firstViewOnly: !caching,
    runs,
    commandLine,
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
    timeout: 2 * DEFAULT_TIMEOUT, // set timeout
    device: mobile ? 'iPhone6' : '',
    priority,
    mobile,
    location: location? location:DEFAULT_LOCATION,
  };

  const testInfo = {
    url: url,
    isTestWithSpeedKit: isClone,
    customSpeedKitConfig: speedKitConfig,
    isSpeedKitComparison: isSpeedKitComparison,
    activityTimeout: activityTimeout,
    testOptions: testOptions,
    skipPrewarm: skipPrewarm
  };

  // Create a new test result
  const pendingTest = new db.TestResult();
  pendingTest.id = db.util.uuid();
  pendingTest.hasFinished = false;
  pendingTest.url = url;
  pendingTest.priority = priority;

  executePrewarm(testInfo, db)
    .then(([testScript, config]) => {
      pendingTest.speedKitConfig = config;
      return executeTest(testScript, pendingTest, testInfo, db);
    })
    // Trigger the callback
    .then(updatedResult => finish && finish(updatedResult))
    .catch(error => handleTestError(pendingTest, 'No script', error, db));

  return pendingTest.ready().then(() => pendingTest.save());
}

/**
 * @param {string} testUrl
 * @param {boolean} isClone
 * @return {string}
 */
function createCommandLineFlags(testUrl, isClone) {
  const http = 'http://';
  if (isClone && testUrl.startsWith(http)) {
    // origin should looks like http://example.com - without any path components
    const end = testUrl.indexOf('/', http.length);
    const origin = testUrl.substring(0, end === -1 ? testUrl.length : end);
    return `--unsafely-treat-insecure-origin-as-secure="${origin}"`;
  }
  return '';
}

/**
 * @param db The Baqend instance.
 * @param {string} testUrl
 * @param {string} location
 * @param {boolean} isClone
 * @param {boolean} isCachingDisabled
 * @param {number} activityTimeout
 * @param {boolean} isSpeedKitComparison
 * @param {boolean} mobile
 * @param {function} callback
 * @return {string}
 * @deprecated Use queueTest.
 */
function startTest(
  db,
  url,
  location,
  isClone,
  isCachingDisabled,
  activityTimeout,
  isSpeedKitComparison,
  mobile,
  finish
) {
  return queueTest({
    // Required parameters
    db,
    url,
    isClone,
    // Optional parameters
    location,
    caching: !isCachingDisabled,
    activityTimeout,
    isSpeedKitComparison,
    mobile,
    finish,
  });
}

exports.startTest = startTest;
exports.queueTest = queueTest;
exports.DEFAULT_LOCATION = DEFAULT_LOCATION;
exports.DEFAULT_ACTIVITY_TIMEOUT = DEFAULT_ACTIVITY_TIMEOUT;
