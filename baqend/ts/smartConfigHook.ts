import {baqend, model} from 'baqend'

import { API } from './Pagetest'
import { TestRequest } from './TestRequest'
import { getMinimalConfig } from './configGeneration'
import { createTestScript } from './createTestScript'
import { getCachedSpeedKitConfig } from './configCaching'
import { WebPagetestResultHandler } from './WebPagetestResultHandler'

const PREWARM_OPTIONS = {
  runs: 1,
  timeline: false,
  video: false,
  firstViewOnly: true,
  minimalResults: true
}


async function hasTestFinished(testId: string): Promise<boolean> {
  const status: any = await API.getTestStatus(testId)
  return status.statusCode === 200
}

function getTestScriptWithMinimalWhitelist(db: baqend, url: string): string {
  const config = getMinimalConfig(db, url, false)
  return createTestScript(url, false, false, config, 75)
}

async function startConfigGenerationTest(db: baqend, testInfo: any): Promise<string|any> {
  const configTestScript = getTestScriptWithMinimalWhitelist(db, testInfo.url)
  const configTestOptions = Object.assign(testInfo.testOptions, PREWARM_OPTIONS)
  try{
    return await API.runTestWithoutWait(configTestScript, configTestOptions)
  } catch(error) {
    db.log.error(`Error while starting WPT test`, { error: error.stack })
  }
}

export async function call(db: baqend, data: { url?: string, testId?: string }):Promise<string|null> {
  const { testId } = data
  const testRequest = new TestRequest(db, data)
  const testInfo = testRequest.getTestInfo()

  if (testId) {
    const finished = await hasTestFinished(testId)
    if (finished) {
      const webPagetestResultHandler = new WebPagetestResultHandler(db)
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
