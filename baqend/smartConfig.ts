import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { bootstrap } from './_compositionRoot'
import { ConfigGenerator } from './_ConfigGenerator'
import { createTestScript } from './_createTestScript'
import { DataType } from './_Serializer'

const SMART_CONFIG_TEST_OPTIONS: Partial<model.TestOptions> = {
  runs: 1,
  timeline: false,
  video: false,
  firstViewOnly: true,
  minimalResults: true,
}

function getTestScriptWithMinimalWhitelist(configGenerator: ConfigGenerator, url: string): string {
  const config = configGenerator.generateMinimal(url, false)
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

  const { testBuilder, pagetest, configGenerator } = bootstrap(db)

  try {
    const configTestScript = getTestScriptWithMinimalWhitelist(configGenerator, url)
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
  const { query: { testId, type = DataType.JAVASCRIPT } } = req
  if (!testId) {
    res.status(400)
    res.send({ error: 'Please provide a test ID.' })
    return
  }

  const { pagetest, webPagetestResultHandler, configCache } = bootstrap(db)
  try {
    // Get test status
    const { statusCode, data: { testInfo: { url, mobile } } } = await pagetest.getTestStatus(testId)

    // Try to get config from cache
    const cachedConfig = await configCache.get(url, !!mobile)
    if (cachedConfig) {
      res.send({ testId, url, mobile, type, config: cachedConfig })
      return
    }

    // Is the test finished?
    if (statusCode === 200) {
      const config = await webPagetestResultHandler.getSmartConfig(testId, url, !!mobile, type)
      res.send({ testId, url, mobile, type, config })
      return
    }

    res.status(404)
    res.send({ testId, url, mobile, type, config: null })
  } catch (error) {
    res.status(500)
    res.send({ error: error.message, stack: error.stack, testId })
  }
}
