const { toFile } = require('./download');
const { getAdSet } = require('./adBlocker');
const credentials = require('./credentials');
const { sleep } = require('./sleep');
const { API } = require('./Pagetest');
const { countHits } = require('./countHits');
const fetch = require('node-fetch');
const { getFMP } = require('./calculateFMP');

/**
 * Generates a test result from the given test and returns the updated test database object.
 *
 * @param testId The id of the executed test.
 * @param pendingTest The test database object.
 * @param db The Baqend instance.
 * @return The updated test object containing the test result.
 */
function generateTestResult(testId, pendingTest, db) {
  db.log.info(`Generating test result: ${testId}`, { testResult: pendingTest.id, testId: testId });

  if (pendingTest.hasFinished) {
    db.log.info(`Result already exists: ${testId}`);
    return Promise.resolve(pendingTest);
  }

  return getResultData(testId, pendingTest, db)
    .then(usedRunIndex => createVideos(testId, pendingTest, usedRunIndex, db))
    .catch(error => {
      db.log.error(`Generating test result failed: ${testId}`,
        { testResult: pendingTest.id, testId: testId, error: error.stack });
      throw error;
    });
}

function getResultData(testId, pendingTest, db) {
  const options = {
    requests: true,
    breakdown: false,
    domains: false,
    pageSpeed: false,
  };

  return API.getTestResults(testId, options)
    .then(result => createTestResult(result.data, pendingTest, db));
}

function createVideos(testId, pendingTest, runIndex, db) {
  db.log.info(`Creating video: ${testId}`);

  const videoFirst = API.createVideo(`${testId}-r:${runIndex}-c:0`);
  const videoRepeat = API.createVideo(`${testId}-r:${runIndex}-c:1`);

  return Promise.all([ videoFirst, videoRepeat ])
    .then(([ firstVideoResult, repeatedVideoResult ]) => {

      pendingTest.videoIdFirstView = firstVideoResult.data.videoId;
      const videoFirstViewPromise = toFile(db, constructVideoLink(testId, pendingTest.videoIdFirstView), `/www/videoFirstView/${testId}.mp4`);

      let videoRepeatViewPromise = Promise.resolve(true);
      if (repeatedVideoResult.data && repeatedVideoResult.data.videoId) {
        pendingTest.videoIdRepeatedView = repeatedVideoResult.data.videoId;
        videoRepeatViewPromise = toFile(db, constructVideoLink(testId, pendingTest.videoIdRepeatedView), `/www/videoRepeatView/${testId}.mp4`);
      }

      return Promise.all([videoFirstViewPromise, videoRepeatViewPromise])
    })
    .then(([videoFirstView, videoRepeatView]) => {
      db.log.info(`Videos created: ${testId}`);
      pendingTest.videoFileFirstView = videoFirstView;
      pendingTest.videoFileRepeatView = videoRepeatView;
      pendingTest.hasFinished = true;
      return pendingTest.ready().then(() => pendingTest.save());
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
 * @param wptData The data from the WPT test.
 * @param pendingTest The test database object used to set the result.
 * @param db The Baqend instance.
 * @return {Promise<TestResult>} The index of the run used to create the test result.
 */
function createTestResult(wptData, pendingTest, db) {
  pendingTest.location = wptData.location;
  pendingTest.url = wptData.testUrl;
  pendingTest.summaryUrl = wptData.summary;
  pendingTest.testDataMissing = false;

  const runIndex = Object.keys(wptData.runs).find(index => isValidRun(wptData.runs[index]));
  db.log.info(`Choosing run ${runIndex}`, { runs: Object.keys(wptData.runs) });

  if (!runIndex) {
    pendingTest.testDataMissing = true;
    return pendingTest.ready()
      .then(() => pendingTest.save())
      .then(() => {
        db.log.error(`No valid test run`, {testResult: pendingTest.id, wptData});
        throw new Error(`No valid test run found: ${wptData.testId}`);
      });
  }

  const resultRun = wptData.runs[runIndex];

  createRun(db, resultRun.firstView, pendingTest.testId)
    .then((firstView) => {
      pendingTest.firstView = firstView
    })
    .then(() => createRun(db, resultRun.repeatView, pendingTest.testId))
    .then((repeatView) => {
      pendingTest.repeatView = repeatView
    })
    .then(() => iskWordPress(wptData.testUrl))
    .then((isWordPress) => {
      pendingTest.isWordPress = isWordPress
    })
    .then(() => pendingTest.ready().then(() => pendingTest.save()))
    .then(() => runIndex);
}

function isValidRun(run) {
  return run.firstView.SpeedIndex > 0 && run.firstView.lastVisualChange > 0;
}

/**
 * @param db The Baqend instance.
 * @param {object} data The data to create the run of.
 * @return {Promise<Run>} A promise resolving with the created run.
 */
function createRun(db, data, testId) {
  if (!data) {
    return null;
  }

  const run = new db.Run();

  // Copy fields
  for (const field of ['loadTime', 'fullyLoaded', 'firstPaint', 'lastVisualChange', 'domElements']) {
    run[field] = data[field];
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

  run.domains = [];

  return chooseFMP(db, data, testId).then((firstMeaningfulPaint) => {
    run.firstMeaningfulPaint = firstMeaningfulPaint;
  }).then(() => createDomainList(data, run));
}

/**
 * @param db The Baqend instance.
 * @param {object} data The data to choose the FMP of.
 * @param {string} testId The id of the test to choose the FMP for.
 */
function chooseFMP(db, data, testId) {
  return getFMP(testId).then(firstMeaningfulPaint => parseInt(firstMeaningfulPaint, 10))
    .catch(() => {
      db.log.warn(`Could not calculate FMP for test ${testId}. Use FMP from wepPageTest instead!`);

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
 * @param url
 * @return {boolean}
 */
function iskWordPress(url) {
  const analyzeSite = fetch(url).then(res => res.text().then(text => text.indexOf('wp-content') !== -1));
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

/**
 * @param {{ domains: Object<string, object> }} data
 * @param {Run} run The run to create the domain list for.
 * @return {Promise<Run>} Passing through `run`.
 */
function createDomainList(data, run) {
  return getAdSet().then((adSet) => {
    for (const key of Object.keys(data.domains)) {
      const domainObject = data.domains[key];
      domainObject.isAdDomain = isAdDomain(key, adSet);
      domainObject.url = key;
      run.domains.push(domainObject);
    }

    return run;
  });
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
