const { getMinimalConfig, createSmartConfig, getFallbackConfig, getCacheWarmingConfig } = require('./configGeneration');
const { createTestScript } = require('./createTestScript');
const { analyzeSpeedKit } = require('./analyzeSpeedKit');
const { API } = require('./Pagetest');
const stringifyObject = require('stringify-object');

const PREWARM_RUNS = 2;
/**
 * Executes prewarm runs to prime the CDN caches and returns the final test script and Speed Kit config for the actual test runs.
 *
 * @param testInfo The basic information about the test.
 * @param db The db reference.
 *
 * @return The final test script and Speed Kit config for the actual test runs.
 */
function executePrewarm(testInfo, db) {
  return getPrewarmConfig(testInfo, db)
    .then(config => {
      if (testInfo.skipPrewarm || !testInfo.isTestWithSpeedKit) {
        db.log.info(`Prewarm skipped`, {testInfo});
        return config;
      }

      const finalTestConfig = getFinalTestConfig(config, testInfo, db);

      const testScript = getScriptForConfig(config, testInfo);
      const prewarmRun = prewarm(testScript, PREWARM_RUNS, testInfo, db);


      return Promise.all([ finalTestConfig, prewarmRun ])
        .then(() => finalTestConfig);
    })
    .catch(error => {
      db.log.warn(`Prewarm failed, using fallback config`, {testInfo, error: error.stack});
      return getFallbackConfig(testInfo.url, testInfo.testOptions.mobile);
    })
    .then(config => [getScriptForConfig(config, testInfo), config]);
}

function getFinalTestConfig(config, testInfo, db) {
  const { customSpeedKitConfig, isSpeedKitComparison } = testInfo;
  // If we have a custom Speed Kit config or compare a site that is using Speed Kit, we already have the final script
  if (customSpeedKitConfig || isSpeedKitComparison) {
    return Promise.resolve(config);
  }

  const minimalTestScript = getTestScriptWithMinimalWhitelist(testInfo);
  return prepareSmartConfig(minimalTestScript, testInfo, db);
}

function getScriptForConfig(config, { url, isSpeedKitComparison, isTestWithSpeedKit, activityTimeout }) {
  return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout);
}

function getPrewarmConfig({url, customSpeedKitConfig, isSpeedKitComparison, testOptions}, db) {

  // Always return the config if it is given
  if (customSpeedKitConfig) {
    db.log.info(`Using custom config: ${url}`, {url, customSpeedKitConfig, isSpeedKitComparison});
    return Promise.resolve(customSpeedKitConfig);
  }

  // Get the config from the actual site if it uses Speed Kit
  if (isSpeedKitComparison) {
    db.log.info(`Extracting config from Website: ${url}`, {url, isSpeedKitComparison});
    return analyzeSpeedKit(url, db).then(it => stringifyObject(it.config)).catch(error => {
      db.log.warn(`Could not analyze speed kit config`, {url, error: error.stack});
      return getFallbackConfig(url, testOptions.mobile);
    });
  }

  // Return a default config
  db.log.info(`Using a default config: ${url}`);
  return Promise.resolve(getCacheWarmingConfig(testOptions.mobile));
}

function prewarm(testScript, runs, { url, testOptions }, db) {
  const prewarmOptions = Object.assign({}, testOptions, {
    runs: runs,
    timeline: false,
    video: false,
    firstViewOnly: true,
    minimalResults: true,
  });

  db.log.info(`Executing ${runs} prewarm runs`, {url, testScript});
  return API.runTest(testScript, prewarmOptions, db)
    .then(testId => {
      new db.Prewarms({ testId }).save().catch();
      db.log.info(`Prewarm done`, {url, testId});
      return testId;
    })
    .catch((error) => {
      db.log.warn(`Prewarm failed`, {url, error});
      return null;
    });
}

function getTestScriptWithMinimalWhitelist({ url, isTestWithSpeedKit, isSpeedKitComparison, activityTimeout, testOptions }) {
  const config = getMinimalConfig(url, testOptions.mobile);
  return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout);
}

function prepareSmartConfig(testScript, testInfo, db) {
  const { url } = testInfo;

  db.log.info(`Generating Smart Config using prewarm`, {url});
  return prewarm(testScript, 1, testInfo, db)
    .then(testId => getSmartConfig(url, testId, testInfo, db))
    .then(config => {
      db.log.info(`Smart Config generated`, {url, config});
      return config;
    })
    .catch(error => {
      db.log.warn(`Smart generation failed`, {url, error});
      return getFallbackConfig(url);
    });
}

function getSmartConfig(url, testId, testInfo, db) {
  const options = {
    requests: true,
    breakdown: false,
    domains: true,
    pageSpeed: false,
  };

  return API.getTestResults(testId, options)
    .then(result => {
      const domains = result.data;
      return createSmartConfig(url, domains, testInfo.testOptions.mobile, db);
    });
}



exports.executePrewarm = executePrewarm;
