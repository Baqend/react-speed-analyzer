import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { bootstrap } from './_compositionRoot'
import { getCachedSpeedKitConfig } from './_configCaching'
import { getMinimalConfig } from './_configGeneration'
import { createTestScript } from './_createTestScript'

const SMART_CONFIG_TEST_OPTIONS: Partial<model.TestOptions> = {
  runs: 1,
  timeline: false,
  video: false,
  firstViewOnly: true,
  minimalResults: true,
}

function getTestScriptWithMinimalWhitelist(db: baqend, url: string): string {
  const config = getMinimalConfig(db, url, false)
  return createTestScript(url, false, false, config, 75)
}

/**
 * POST: Start the smart config generation.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { body: { url, params = {} } } = req
  if (!url) {
    res.status(400)
    res.send({ error: 'Please provide a URL.' })
  }

  const { testBuilder, pagetest } = bootstrap(db)

  try {
    const configTestScript = getTestScriptWithMinimalWhitelist(db, url)
    const testParams = testBuilder.buildParams(params)
    const testOptions = Object.assign(testBuilder.buildOptions(testParams), SMART_CONFIG_TEST_OPTIONS)
    const testId = await pagetest.runTestWithoutWait(configTestScript, testOptions)

    res.send({ testId, url, params })
  } catch (error) {
    res.status(500)
    res.send({ error: error.message, stack: error.stack, url, params })
  }
}

/**
 * GET: Get the config for a given test ID.
 */
export async function get(db: baqend, req: Request, res: Response) {
  const { query: { testId } } = req
  if (!testId) {
    res.status(400)
    res.send({ error: 'Please provide a test ID.' })
    return
  }

  const { pagetest, webPagetestResultHandler } = bootstrap(db)
  try {
    // Get test status
    const { statusCode, data: { testInfo: { url, mobile } } } = await pagetest.getTestStatus(testId)

    // Try to get config from cache
    const cachedConfig = await getCachedSpeedKitConfig(db, url, !!mobile)
    if (cachedConfig) {
      res.send({ testId, url, mobile, config: cachedConfig })
      return
    }

    // Is the test finished?
    if (statusCode === 200) {
      const config = await webPagetestResultHandler.getSmartConfig(testId, url, !!mobile)
      res.send({ testId, url, mobile, config })
      return
    }

    res.status(404)
    res.send({ testId, url, mobile, config: null })
  } catch (error) {
    res.status(500)
    res.send({ error: error.message, stack: error.stack, testId })
  }
}
