import { model } from 'baqend'
import { MultiTestParams, Priority, TestParams } from './_TestParams'

export const DEFAULT_SINGLE_PRIORITY = Priority.HIGHEST
export const DEFAULT_BULK_PRIORITY = Priority.LOWEST
export const DEFAULT_PLESK_PRIORITY = Priority.HIGHEST
export const DEFAULT_LOCATION = 'eu-central-1:Chrome.Native'
export const DEFAULT_ACTIVITY_TIMEOUT = 75
export const DEFAULT_TIMEOUT = 30

/**
 * The default test params.
 */
export const DEFAULT_PARAMS: Required<TestParams> = {
  activityTimeout: DEFAULT_ACTIVITY_TIMEOUT,
  caching: false,
  location: DEFAULT_LOCATION,
  mobile: false,
  priority: DEFAULT_SINGLE_PRIORITY,
  skipPrewarm: false,
  speedKitConfig: null,
  timeout: DEFAULT_TIMEOUT,
}

/**
 * The default test options.
 */
export const DEFAULT_TEST_OPTIONS: Partial<model.TestOptions> = {
  runs: 2,
  video: true,
  disableOptimization: true,
  pageSpeed: false,
  requests: false,
  breakDown: false,
  domains: false,
  saveResponseBodies: false,
  tcpDump: false,
  timeline: false,
  minimumDuration: 1, // capture at least one second
  chromeTrace: false,
  netLog: false,
  disableHTTPHeaders: true,
  disableScreenshot: true,
  ignoreSSL: true,
  block: 'favicon', // exclude favicons for fair comparison, as not handled by SWs
  jpegQuality: 100,
  poll: 1, // poll every second
  timeout: 2 * DEFAULT_TIMEOUT,
}

export class TestBuilder {
  /**
   * Build test parameters for single runs.
   */
  buildSingleTestParams(params: TestParams, speedKitConfig: string | null = null, priority: Priority = DEFAULT_SINGLE_PRIORITY): Required<TestParams> {
    return Object.assign({}, DEFAULT_PARAMS, params, {
      speedKitConfig: params.speedKitConfig || speedKitConfig,
      priority: params.priority || priority,
    })
  }

  /**
   * Build test parameters for bulk runs.
   */
  buildBulkParams(params: MultiTestParams, runs: number = 1, speedKitConfig: string | null = null, priority: Priority = DEFAULT_BULK_PRIORITY): Required<MultiTestParams> {
    return Object.assign({}, DEFAULT_PARAMS, params, {
      speedKitConfig: params.speedKitConfig || speedKitConfig,
      priority: params.priority || priority,
      runs: params.runs || runs,
    })
  }

  buildOptions(params: Required<TestParams>, commandLine: string = ''): model.TestOptions {
    const device = params.mobile ? 'iPhone6' : ''
    const testOptions: model.TestOptions = {
      commandLine,
      device,
      firstViewOnly: !params.caching,
      priority: params.priority,
      location: params.location,
      timeout: 2 * params.timeout,
      mobile: params.mobile,
    }

    return Object.assign({}, DEFAULT_TEST_OPTIONS, testOptions)
  }
}
