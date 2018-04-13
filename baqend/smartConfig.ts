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
    const testParams = testBuilder.buildSingleTestParams(params)
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

  const { pagetest, webPagetestResultHandler, configCache, serializer } = bootstrap(db)

  /**
   * Gets the config for the given situation.
   */
  async function getConfig(statusCode: number, url: string, mobile: boolean, type: DataType): Promise<string | null> {
    // Try to get config from cache
    const cachedConfig = await configCache.get(url, mobile)
    if (cachedConfig) {
      return serializer.serialize(cachedConfig, type)
    }

    // Is the test finished?
    if (statusCode === 200) {
      return serializer.serialize(webPagetestResultHandler.getSmartConfig(testId, url, mobile), type)
    }

    return null
  }

  try {
    // Get test status
    const { statusCode, data: { testInfo: { url, mobile: mobileAsNumber } } } = await pagetest.getTestStatus(testId)
    const mobile = mobileAsNumber > 0

    const config = await getConfig(statusCode, url, mobile, type)
    res.status(config !== null ? 200 : 404)
    res.send({ testId, url, mobile, type, config })
  } catch (error) {
    res.status(500)
    res.send({ error: error.message, stack: error.stack, testId })
  }
}
