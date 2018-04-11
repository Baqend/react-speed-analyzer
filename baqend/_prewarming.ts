import { baqend, model } from 'baqend'
import stringifyObject from 'stringify-object'
import { analyzeSpeedKit } from './_analyzeSpeedKit'
import { createSmartConfig, getFallbackConfig, getMinimalConfig } from './_configGeneration'
import { createTestScript } from './_createTestScript'
import { API } from './_Pagetest'

const PREWARM_RUNS = 2

/**
 * Executes prewarm runs to prime the CDN caches and returns the final test script and Speed Kit config for the actual test runs.
 *
 * @param testInfo The basic information about the test.
 * @param db The db reference.
 *
 * @return The final test script and Speed Kit config for the actual test runs.
 */
export function executePrewarm(testInfo: any, db: baqend) {
  return getPrewarmConfig(testInfo, db)
    .then(config => {
      if (testInfo.skipPrewarm || !testInfo.isTestWithSpeedKit) {
        db.log.info(`Prewarm skipped`, {testInfo})
        return config
      }

      const finalTestConfig = getFinalTestConfig(config, testInfo, db)

      const testScript = getScriptForConfig(config, testInfo)
      const prewarmRun = prewarm(testScript, PREWARM_RUNS, testInfo, db)


      return Promise.all([ finalTestConfig, prewarmRun ])
        .then(() => finalTestConfig)
    })
    .catch(error => {
      db.log.warn(`Prewarm failed, using fallback config`, {testInfo, error: error.stack})
      return getFallbackConfig(db, testInfo.url, testInfo.testOptions.mobile)
    })
    .then(config => [getScriptForConfig(config, testInfo), config])
}

function getFinalTestConfig(config: string, testInfo: any, db: baqend) {
  const { customSpeedKitConfig, isSpeedKitComparison } = testInfo
  // If we have a custom Speed Kit config or compare a site that is using Speed Kit, we already have the final script
  if (customSpeedKitConfig || isSpeedKitComparison) {
    return Promise.resolve(config)
  }

  const minimalTestScript = getTestScriptWithMinimalWhitelist(db, testInfo)
  return prepareSmartConfig(minimalTestScript, testInfo, db)
}

export function getScriptForConfig(config: string, { url, isSpeedKitComparison, isTestWithSpeedKit, activityTimeout, testOptions }: any) {
  if (!config) {
    config = getFallbackConfig(url, testOptions.mobile)
  }
  return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout)
}

export function getPrewarmConfig({ url, customSpeedKitConfig, isSpeedKitComparison, testOptions }: any, db: baqend) {
  // Always return the config if it is given
  if (customSpeedKitConfig) {
    db.log.info(`Using custom config: ${url}`, {url, customSpeedKitConfig, isSpeedKitComparison})
    return Promise.resolve(customSpeedKitConfig)
  }
  // Get the config from the actual site if it uses Speed Kit
  if (isSpeedKitComparison) {
    db.log.info(`Extracting config from Website: ${url}`, {url, isSpeedKitComparison})
    return analyzeSpeedKit(url, db).then(it => stringifyObject(it.config)).catch(error => {
      db.log.warn(`Could not analyze speed kit config`, {url, error: error.stack})
      return getFallbackConfig(db, url, testOptions.mobile)
    })
  }
  // Return a default config
  db.log.info(`Using a default config: ${url}`)
  // FIXME Testing whether fallback config leads to fewer errors in WPT and still does prewarming
  // return Promise.resolve(getCacheWarmingConfig(testOptions.mobile))
  return Promise.resolve(getFallbackConfig(db, url, testOptions.mobile))
}

function prewarm(testScript: string, runs: number, { url, testOptions }: { url: string, testOptions: any }, db: baqend) {
  const prewarmOptions = Object.assign({}, testOptions, {
    runs: runs,
    timeline: false,
    video: false,
    firstViewOnly: true,
    minimalResults: true,
  })

  db.log.info(`Executing ${runs} prewarm runs`, {url, testScript})
  return API.runTest(testScript, prewarmOptions, db)
    .then(testId => {
      new db.Prewarms({ testId, prio: testOptions.priority || 0, url }).save().catch(error => {
        db.log.error(`Could not save prewarm info`, {error: error.stack})
      })
      db.log.info(`Prewarm done`, {url, testId})
      return testId
    })
    .catch((error) => {
      throw new Error(`Prewarm failed for ${url}: ${error.message}`)
    })
}

export function getTestScriptWithMinimalWhitelist(db: baqend, { url, isTestWithSpeedKit, isSpeedKitComparison, activityTimeout, testOptions }: any) {
  const config = getMinimalConfig(db, url, testOptions.mobile)
  return createTestScript(url, isTestWithSpeedKit, isSpeedKitComparison, config, activityTimeout)
}

async function prepareSmartConfig(testScript: string, testInfo: any, db: baqend) {
  const { url } = testInfo

  try {
    db.log.info(`Generating Smart Config using prewarm`, { url })
    const testId = await prewarm(testScript, 1, testInfo, db)
    const config = getSmartConfig(url, testId, testInfo, db)
    db.log.info(`Smart Config generated`, { url, config })

    return config
  } catch (error) {
    db.log.warn(`Smart generation failed: ${error.message}`, { url, error })
    return getFallbackConfig(db, url)
  }
}

function getSmartConfig(url: string, testId: string, testInfo: model.TestInfo, db: baqend) {
  const options = {
    requests: true,
    breakdown: false,
    domains: true,
    pageSpeed: false,
  }

  return API.getTestResults(testId, options)
    .then(result => {
      const domains = result.data
      return createSmartConfig(db, url, domains, testInfo.testOptions.mobile)
    })
}
