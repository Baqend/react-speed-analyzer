import { baqend } from 'baqend'
import { Request, Response } from 'express'
import { Pagetest, WptTestResultOptions } from './_Pagetest'
import { testScript } from './_TestScript'

const DEFAULT_TEST_OPTIONS = {
  runs: 1,
  video: false,
  noopt: true,
  pageSpeed: false,
  requests: true,
  timeout: 60,
  priority: 1,
  mobile: false,
  cmdline: '',
  mobileDevice: '',
  fvonly: true,
  location: 'eu-central-1-docker:Chrome.FIOSNoLatency'
}

const DEFAULT_RESULT_OPTIONS: WptTestResultOptions = {
  requests: true,
  breakdown: false,
  domains: false,
  pageSpeed: false,
}

/**
 * GET: Get state of comparison by ID.
 */
export async function get(db: baqend, request: Request, response: Response) {
  const { query: { wptTestId } } = request
  if (!wptTestId) {
    response.status(400)
    response.send({ error: 'Please send the wptTestId as a parameter.' })
  }

  const pageTest = new Pagetest()
  const status = await pageTest.getTestStatus(wptTestId)
  if (!status || status.statusCode !== 200) {
    response.send({ testResult: null })
  }

  const testResult = await pageTest.getTestResults(wptTestId, DEFAULT_RESULT_OPTIONS)
  response.send({ testResult })
}

/**
 * POST: Start comparison for given domain.
 */
export async function post(db: baqend, request: Request, response: Response) {
  const { body } = request
  const { url, script } = body as { url?: string, script?: string }
  if (!url && !script) {
    response.status(400)
    response.send({ error: 'Please send ether a "url" or a "script".' })
  }

  const pageTest = new Pagetest()
  const scriptToExecute = script || testScript().navigate(url!).toString();

  try {
    const wptTestId = await pageTest.runTestWithoutWait(scriptToExecute, DEFAULT_TEST_OPTIONS)
    response.send({ wptTestId })
  } catch (e) {
    response.status(500)
    response.send({ error: e.message, stack: e.stack, script: scriptToExecute })
  }
}
