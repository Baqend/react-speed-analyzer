import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { getCachedSpeedKitConfig } from './_configCaching'
import { getMinimalConfig } from './_configGeneration'
import { createTestScript } from './_createTestScript'
import { API } from './_Pagetest'

const PREWARM_OPTIONS = {
  runs: 1,
  timeline: false,
  video: false,
  firstViewOnly: true,
  minimalResults: true,
}


async function hasTestFinished(testId: string): Promise<boolean> {
  const status = await API.getTestStatus(testId)
  return status.statusCode === 200
}

function getTestScriptWithMinimalWhitelist(db: baqend, url: string): string {
  const config = getMinimalConfig(db, url, false)
  return createTestScript(url, false, false, config, 75)
}

async function startConfigGenerationTest(db: baqend, testInfo: any): Promise<string | any> {
  const configTestScript = getTestScriptWithMinimalWhitelist(db, testInfo.url)
  const configTestOptions = Object.assign(testInfo.testOptions, PREWARM_OPTIONS)
  try {
    return await API.runTestWithoutWait(configTestScript, configTestOptions)
  } catch (error) {
    db.log.error(`Error while starting WPT test`, { error: error.stack })
  }
}

/**
 * FIXME: Maybe inappropriate behavior when called with testId
 */
export async function call(db: baqend, data: any): Promise<string | null> {
  const { testFactory, webPagetestResultHandler } = bootstrap(db)
  const { testId } = data
  const testInfo = testFactory.getTestInfo(data)

  if (testId) {
    const finished = await hasTestFinished(testId)
    if (finished) {
      return await webPagetestResultHandler.getSmartConfig(testId, testInfo)
    }

    return null
  }

  return getCachedSpeedKitConfig(db, testInfo.url, false).then(cachedConfig => {
    if (cachedConfig) {
      return cachedConfig
    }

    return startConfigGenerationTest(db, testInfo).then(testId => testId)
  })
}
