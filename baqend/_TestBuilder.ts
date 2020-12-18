import { model } from 'baqend'
import { MultiTestParams, Priority, TestParams } from './_TestParams'
import credentials from './credentials'

export const DEFAULT_SINGLE_PRIORITY = Priority.HIGHEST
export const DEFAULT_BULK_PRIORITY = Priority.LOWEST
export const DEFAULT_PLESK_PRIORITY = Priority.LESS_HIGH
export const DEFAULT_LOCATION = 'eu-central-1-docker:Chrome.FIOSNoLatency'
export const DEFAULT_ACTIVITY_TIMEOUT = 75
export const DEFAULT_TIMEOUT = 30

/**
 * The default test params.
 */
export const DEFAULT_PARAMS: Required<TestParams> = {
  url: '',
  app: credentials.app,
  activityTimeout: DEFAULT_ACTIVITY_TIMEOUT,
  caching: false,
  location: DEFAULT_LOCATION,
  mobile: false,
  priority: DEFAULT_SINGLE_PRIORITY,
  skipPrewarm: false,
  speedKitConfig: null,
  timeout: DEFAULT_TIMEOUT,
  speedKitExpected: false,
  preload: false,
  ignoreConfig: false,
  cookie: '',
}

/**
 * The default test options.
 */
export const DEFAULT_TEST_OPTIONS: Partial<model.TestOptions> = {
  runs: 1,
  video: true,
  noopt: true,
  pageSpeed: false,
  requests: false,
  breakDown: false,
  domains: false,
  bodies: false,
  keepua: true,
  tcpDump: false,
  timeline: true,
  time: 1, // capture at least one second
  chromeTrace: false,
  netLog: false,
  noheaders: true,
  noimages: true,
  ignoreSSL: true,
  block: 'favicon', // exclude favicons for fair comparison, as not handled by SWs
  iq: 100,
  timeout: 2 * DEFAULT_TIMEOUT,
}

export class TestBuilder {
  /**
   * Build test parameters for single runs.
   */
  buildSingleTestParams(params: TestParams, speedKitConfig: string | null = null, priority: Priority = DEFAULT_SINGLE_PRIORITY): Required<TestParams> {
    return Object.assign({}, DEFAULT_PARAMS, params, {
      speedKitConfig: params.speedKitConfig || speedKitConfig,
      priority: typeof params.priority !== 'number' ? priority : params.priority,
    })
  }

  /**
   * Build test parameters for bulk runs.
   */
  buildBulkParams(params: MultiTestParams, runs: number = 1, speedKitConfig: string | null = null, priority: Priority = DEFAULT_BULK_PRIORITY): Required<MultiTestParams> {
    return Object.assign({}, DEFAULT_PARAMS, params, {
      speedKitConfig: params.speedKitConfig || speedKitConfig,
      priority: typeof params.priority !== 'number' ? priority : params.priority,
      runs: params.runs || runs,
    })
  }

  buildOptions(params: Required<TestParams>, url: string, isClone: boolean, cmdline: string = ''): model.TestOptions {
    const mobileDevice = params.mobile ? 'iPhone6' : ''
    const testOptions: model.TestOptions = {
      cmdline,
      mobileDevice,
      fvonly: !params.caching,
      priority: params.priority,
      location: params.location,
      timeout: 2 * params.timeout,
      mobile: params.mobile,
      label: isClone ? `Speed Kit ${url}` : url
    }

    return Object.assign({}, DEFAULT_TEST_OPTIONS, testOptions)
  }
}
