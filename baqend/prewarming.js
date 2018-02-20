const { getMinimalConfig, createSmartConfig, getFallbackConfig, getCacheWarmingConfig } = require('./configGeneration');
const { createTestScript } = require('./createTestScript');
const { analyzeSpeedKit } = require('./analyzeSpeedKit');
const { API } = require('./Pagetest');

const PREWARM_RUNS = 2;
/**
 * Executes prewarm runs to prime the CDN caches and returns the final test script for the actual test runs.
 *
 * @param testInfo The basic information about the test.
 * @param db The db reference.
 *
 * @return The final test script for the actual test runs.
 */
function executePrewarm(testInfo, pendingTest, db) {
  return getPrewarmScript(testInfo, db)
    .then(testScript => {
      if (testInfo.skipPrewarm || !testInfo.isTestWithSpeedKit) {
        return testScript;
      }

      const finalTestScript = getFinalTestScript(testScript, testInfo, db);
      const prewarmRun = prewarm(testScript, PREWARM_RUNS, testInfo, db);

      return Promise.all([ finalTestScript, prewarmRun ]).then(() => finalTestScript);
    })
    .catch(error => {
      db.log.warn(`Prewarm failed`, {testInfo, error: error.stack});
      return getFallbackConfig(testInfo.url);
    });
}


function getFinalTestScript(testScript, testInfo, db) {
  const { customSpeedKitConfig, isSpeedKitComparison } = testInfo;
  // If we have a custom Speed Kit config or compare a site that is using Speed Kit, we already have the final script
  if (customSpeedKitConfig || isSpeedKitComparison) {
    return Promise.resolve(testScript);
  }

  const minimalTestScript = getTestScriptWithMinimalWhitelist(testInfo);
  return prepareSmartConfig(minimalTestScript, testInfo, db);
}

function getPrewarmScript({ url, customSpeedKitConfig, isSpeedKitComparison, isTestWithSpeedKit, activityTimeout }, db) {
  return getPrewarmConfig(url, customSpeedKitConfig, isSpeedKitComparison, db)
    .then(config => createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout));
}

function getPrewarmConfig(url, speedKitConfig, isSpeedKitComparison, db) {

  // Always return the config if it is given
  if (speedKitConfig) {
    db.log.info(`Using custom config: ${url}`, {url, speedKitConfig, isSpeedKitComparison});
    return Promise.resolve(speedKitConfig);
  }

  // Get the config from the actual site if it uses Speed Kit
  if (isSpeedKitComparison) {
    db.log.info(`Extracting config from Website: ${url}`, {url, isSpeedKitComparison});
    return analyzeSpeedKit(url, db).then(it => it.config).catch(error => {
      db.log.warn(`Could not analyze speed kit config`, {url, error: error.stack});
      return getFallbackConfig();
    });
  }

  // Return a default config
  db.log.info(`Using a default config: ${url}`);
  return Promise.resolve(getCacheWarmingConfig());
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
      db.log.info(`Prewarm done`, {url, testId});
      return testId;
    })
    .catch((error) => {
      db.log.warn(`Prewarm failed`, {url, error});
      return null;
    });
}

function getTestScriptWithMinimalWhitelist({url, isTestWithSpeedKit, isSpeedKitComparison, activityTimeout}) {
  const config = getMinimalConfig(url);
  return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout);
}

function prepareSmartConfig(testScript, testInfo, db) {
  const { url, activityTimeout } = testInfo;

  db.log.info(`Generating Smart Config using prewarm`, {url});
  return prewarm(testScript, 1, testInfo, db)
    .then(testId => getSmartConfig(url, testId, db))
    .then(config => {
      db.log.info(`Smart Config generated`, {url, config});
      return config;
    })
    .catch(error => {
      db.log.warn(`Smart generation failed`, {url, error});
      return getFallbackConfig(url);
    })
    .then(config => createTestScript(url, true, false, config, activityTimeout));
}

function getSmartConfig(url, testId, db) {
  const options = {
    requests: true,
    breakdown: false,
    domains: true,
    pageSpeed: false,
  };

  return API.getTestResults(testId, options)
    .then(result => {
      const domains = result.data;
      return createSmartConfig(url, domains, db);
    });
}



exports.executePrewarm = executePrewarm;
