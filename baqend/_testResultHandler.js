const { API } = require('./Pagetest');
const { generateTestResult } = require('./resultGeneration');
const { createSmartConfig, getFallbackConfig } = require('./configGeneration');

const CONFIG_TYPE = 'config';
const PERFORMANCE_TYPE = 'performance';

/**
 * Get the smart config based on the domains of a given testId.
 *
 * @param db The Baqend instance.
 * @param {string} testId The id of the test to get the domains from.
 * @param {object} testInfo The info of the corresponding test.
 */
function getSmartConfig(db, testId, testInfo) {
  const options = {
    requests: true,
    breakdown: false,
    domains: true,
    pageSpeed: false,
  };

  return API.getTestResults(testId, options)
    .then(result => {
      const domains = result.data;
      db.log.info(`Generating Smart Config`, {url: testInfo.url});
      return createSmartConfig(testInfo.url, domains, testInfo.isMobile, db);
    })
    .then(config => {
      db.log.info(`Smart Config generated`, {url: testInfo.url, config});
      return config;
    })
    .catch(error => {
      db.log.warn(`Smart generation failed`, {url: testInfo.url, error});
      return getFallbackConfig(db, testInfo.url);
    });
}

/**
 * Get the corresponding WPT info object (id, type and status) of a given testId.
 *
 * @param {TestResult} testResult The result in which the info is to be found.
 * @param {string} testId The id to get the WPT info for.
 */
function getWPTInfo(testResult, testId) {
  return testResult.webPagetests.find(wpt => wpt.testId === testId)
}

/**
 * Handles the result of a given WPT test id.
 *
 * @param db The Baqend instance.
 * @param {string} testId The id of the WPT test to be handled.
 */
function handleWPTResult(db, testId) {
  return db.TestResult.find().eq('webPagetests.testId', testId).singleResult().then(testResult => {
    if (!testResult) {
      db.log.warn(`There was no testResult found for testId`, { testId });
      throw new Error(`No testResult found in cache ${testId}`);
    }

    const webPageTestInfo = getWPTInfo(testResult, testId);
    if (!webPageTestInfo) {
      db.log.warn(`Unable to verify test type`, { testResult });
      throw new Error(`No WPT info with id ${testId} found for testResult ${testResult.id}`);
    }

    let promise = Promise.resolve();
    if (webPageTestInfo.testType === CONFIG_TYPE) {
      const testInfo = testResult.testInfo;
      promise = getSmartConfig(db, testId, testInfo).then((config) => {
        testResult.speedKitConfig = config;
      })

    } else if (webPageTestInfo.testType === PERFORMANCE_TYPE) {
      db.log.info(`Test successful: ${testId}`, { testResult: testResult.id, testId});
      promise = generateTestResult(testId, testResult, db).then((updatedResult) => {
        testResult = updatedResult;
      });
    }

    return promise.then(() => {
      webPageTestInfo.hasFinished = true;
      return testResult.ready().then(() => testResult.save());
    })
  });
}

exports.handleWPTResult = handleWPTResult;
