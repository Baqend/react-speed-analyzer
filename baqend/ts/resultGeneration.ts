const { toFile } = require('./download');
const { getAdSet } = require('./adBlocker');
import credentials from './credentials';
const { sleep } = require('./sleep');
import { API, WptTestResult } from './Pagetest'
const { countHits } = require('./countHits');
import fetch from 'node-fetch';
const { getFMP } = require('./calculateFMP');

/**
 * Generates a test result from the given test and returns the updated test database object.
 *
 * @param testId The id of the executed test.
 * @param pendingTest The test database object.
 * @param db The Baqend instance.
 * @return The updated test object containing the test result.
 */
function generateTestResult(testId: string, pendingTest, db) {
  db.log.info(`Generating test result: ${testId}`, { testResult: pendingTest.id, testId });

  if (pendingTest.hasFinished) {
    db.log.info(`Result already exists: ${testId}`);
    return Promise.resolve(pendingTest);
  }

  return getResultRawData(testId)
    .then((rawData) => {
      pendingTest.location = rawData.location;
      pendingTest.url = rawData.testUrl;
      pendingTest.summaryUrl = rawData.summary;
      pendingTest.testDataMissing = false;

      const runIndex = getValidTestRun(db, rawData, pendingTest.id);
      return Promise.all([
        createTestResult(db, rawData, testId, runIndex),
        createVideos(db, testId, runIndex)
      ]);
    })
    .then(([testResult, videos]) => {
      const [firstView, repeatView, isWordPress] = testResult;
      const [videoFirstView, videoRepeatView] = videos;

      pendingTest.firstView = firstView;
      pendingTest.repeatView = repeatView;
      pendingTest.isWordPress = isWordPress;

      db.log.info(`Videos created: ${testId}`);
      pendingTest.videoFileFirstView = videoFirstView;
      pendingTest.videoFileRepeatView = videoRepeatView;

      pendingTest.hasFinished = true;
      return pendingTest.ready().then(() => pendingTest.save());
    })
    .catch(error => {
      db.log.error(`Generating test result failed: ${testId}`,
        { testResult: pendingTest.id, testId, error: error.stack });
      pendingTest.testDataMissing = true;
      pendingTest.hasFinished = true;
      return pendingTest.ready().then(() => pendingTest.save());
    });
}

function getResultRawData(testId: string): Promise<WptTestResult> {
  const options = {
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
function createVideos(db, testId, runIndex) {
  db.log.info(`Creating video: ${testId}`);

  const videoFirst = API.createVideo(testId, runIndex, 0);
  const videoRepeat = API.createVideo(testId, runIndex, 1);

  return Promise.all([videoFirst, videoRepeat])
    .then(([firstVideoResult, repeatedVideoResult]) => {
      const videoFirstViewPromise = toFile(db, constructVideoLink(testId, firstVideoResult), `/www/videoFirstView/${testId}.mp4`);

      let videoRepeatViewPromise = Promise.resolve(true);
      if (repeatedVideoResult) {
        videoRepeatViewPromise = toFile(db, constructVideoLink(testId, repeatedVideoResult), `/www/videoRepeatView/${testId}.mp4`);
      }

      return Promise.all([videoFirstViewPromise, videoRepeatViewPromise]);
    });
}

/**
 * @param {string} testId
 * @param {string} videoId
 * @return {string}
 */
function constructVideoLink(testId, videoId) {
  const date = `${testId.substr(0, 2)}/${testId.substr(2, 2)}/${testId.substr(4, 2)}`;
  const videoLink = videoId.substr(videoId.indexOf('_') + 1, videoId.length);
  return `http://${credentials.wpt_dns}/results/video/${date}/${videoLink}/video.mp4`;
}

/**
 * Creates the test result and returns which run was used for that.
 *
 * @param db The Baqend instance.
 * @param wptData The data from the WPT test.
 * @param testId The id of the test to create the result for.
 * @param {string} runIndex The index of the run to create the result for.
 * @return {Promise} The test result with its views and a WordPress flag.
 */
function createTestResult(db, wptData, testId, runIndex) {
  const resultRun = wptData.runs[runIndex];
  return Promise.all([
    createRun(db, resultRun.firstView, testId, runIndex),
    createRun(db, resultRun.repeatView, testId, runIndex),
    iskWordPress(db, wptData.testUrl)
  ])
}

function isValidRun(run) {
  return run.firstView && run.firstView.SpeedIndex > 0 && run.firstView.lastVisualChange > 0;
}


function getValidTestRun(db, wptData, testId) {
  const runIndex = Object.keys(wptData.runs).find(index => isValidRun(wptData.runs[index]));
  db.log.info(`Choosing run ${runIndex}`, { runs: Object.keys(wptData.runs) });

  if (!runIndex) {
    db.log.error(`No valid test run`, {testResult: testId, wptData});
    throw new Error(`No valid test run found: ${wptData.id}`);
  }

  return runIndex;
}

/**
 * @param db The Baqend instance.
 * @param {object} data The data to create the run of.
 * @param {string} testId The test id to create the run for.
 * @param {string} runIndex The index of the run to create the run for.
 * @return {Promise<Run>} A promise resolving with the created run.
 */
function createRun(db, data, testId, runIndex) {
  if (!data) {
    return null;
  }

  const run = new db.Run();

  // Copy fields
  for (const field of ['loadTime', 'fullyLoaded', 'firstPaint', 'lastVisualChange', 'domElements']) {
    run[field] =  Math.round(data[field]);
  }

  // Set TTFB
  run.ttfb = data.TTFB;

  // Set other
  run.domLoaded = data.domContentLoadedEventStart;
  run.load = data.loadEventStart;
  run.startRender = data.render;
  run.speedIndex = data.SpeedIndex;
  run.requests = data.requests.length;
  run.failedRequests = createFailedRequestsCount(data);
  run.bytes = data.bytesIn;
  run.hits = new db.Hits(countHits(data.requests));
  run.basePageCDN = data.base_page_cdn;

  // Set visual completeness
  const completeness = new db.Completeness();
  completeness.p85 = data.visualComplete85;
  completeness.p90 = data.visualComplete90;
  completeness.p95 = data.visualComplete95;
  completeness.p99 = data.visualComplete99;
  completeness.p100 = data.visualComplete;
  run.visualCompleteness = completeness;

  return Promise.all([chooseFMP(db, data, testId, runIndex), createDomainList(data)])
    .then(([firstMeaningfulPaint, domains]) => {
      run.firstMeaningfulPaint = firstMeaningfulPaint;
      run.domains = domains;
      return run;
  })
}

/**
 * @param db The Baqend instance.
 * @param {object} data The data to choose the FMP of.
 * @param {string} testId The id of the test to choose the FMP for.
 * @param {string} runIndex The index of the run to choose the FMP for.
 */
function chooseFMP(db, data, testId, runIndex) {
  return getFMP(testId, runIndex).then(firstMeaningfulPaint => parseInt(firstMeaningfulPaint, 10))
    .catch((error) => {
      db.log.warn(`Could not calculate FMP for test ${testId}. Use FMP from wepPageTest instead!`, { error: error.stack });

      // Search First Meaningful Paint from timing
      const { chromeUserTiming = [] } = data;
      const firstMeaningfulPaintObject =
        chromeUserTiming
          .reverse()
          .find(entry => entry.name === 'firstMeaningfulPaint' || entry.name === 'firstMeaningfulPaintCandidate');

      return firstMeaningfulPaintObject ? firstMeaningfulPaintObject.time : 0;
    });
}

/**
 * Method to check whether the website with the given url is based on WordPress
 *
 * @param db The Baqend instance.
 * @param url
 * @return {boolean}
 */
function iskWordPress(db, url) {
  const analyzeSite = fetch(url).then(res => res.text().then(text => text.indexOf('wp-content') !== -1))
    .catch(error => {
      db.log.warn(`Cannot analyze whether site is WordPress`, { url, errror: error.stack});
      return false;
    });
  const timneout = sleep(10000, false);
  return Promise.race([ analyzeSite, timneout ]);
}

function createFailedRequestsCount(data) {
  let failedRequests = 0;
  data.requests.forEach((request) => {
    if (request.responseCode >= 400) {
      failedRequests += 1;
    }
  });

  return failedRequests;
}

function createDomainList(data) {
  const domains = [];
  return getAdSet().then((adSet) => {
    for (const key of Object.keys(data.domains)) {
      const domainObject = data.domains[key];
      domainObject.isAdDomain = isAdDomain(key, adSet);
      domainObject.url = key;
      domains.push(domainObject);
    }

    return domains;
  }).catch(e => domains);
}

/**
 * @param {string} url
 * @param {Set<string>} adSet
 * @return {boolean}
 */
function isAdDomain(url, adSet) {
  const index = url.indexOf('.');
  if (index === -1) {
    return false;
  }

  if (adSet.has(url)) {
    return true;
  }

  return isAdDomain(url.substr(index + 1), adSet);
}

exports.generateTestResult = generateTestResult;
