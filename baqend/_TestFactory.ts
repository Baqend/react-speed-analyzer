import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { truncateUrl } from './_helpers'
import { setFailed, setQueued } from './_Status'
import { TestBuilder } from './_TestBuilder'
import { TestParams } from './_TestParams'

/**
 * Creates TestResult objects, that have all the information needed in order to be processed by the TestWorker.
 */
export class TestFactory implements AsyncFactory<model.TestResult> {
  constructor(
    private readonly db: baqend,
    private readonly testBuilder: TestBuilder,
  ) {
  }

  async create(url: string, isClone: boolean, params: Required<TestParams>): Promise<model.TestResult> {
    const { priority, location } = params
    const commandLine = this.createCommandLineFlags(url, isClone)
    if (commandLine) {
      this.db.log.info('flags: %s', commandLine)
    }

    const truncatedUrl = await truncateUrl(url)
    const testResult = new this.db.TestResult({ url: truncatedUrl, isClone, location, priority })
    setQueued(testResult)
    testResult.testInfo = this.createTestInfo(url, isClone, params)
    testResult.webPagetests = []

    return testResult.save()
  }

  createWithError(url: string, isClone: boolean) {
    const testResult = new this.db.TestResult({ url, isClone, testDataMissing: true })
    setFailed(testResult)

    return testResult.save()
  }

  /**
   * Creates a string that is used to execute the WebPageTest with some custom commands.
   * If the URL is http only, it adds an extra flag to inject SpeedKit into non secure websites.
   */
  private createCommandLineFlags(testUrl: string, isClone: boolean): string {
    const http = 'http://'
    if (isClone && testUrl.startsWith(http)) {
      // origin should looks like http://example.com - without any path components
      const end = testUrl.indexOf('/', http.length)
      const origin = testUrl.substring(0, end === -1 ? testUrl.length : end)

      return `--unsafely-treat-insecure-origin-as-secure="${origin}"`
    }

    return ''
  }

  /**
   * Create a test info object.
   */
  createTestInfo(url: string, isClone: boolean, params: Required<TestParams>): model.TestInfo {
    const commandLine = this.createCommandLineFlags(url, isClone)
    if (commandLine) {
      this.db.log.info('flags: %s', commandLine)
    }

    return {
      url,
      appName: params.app,
      isTestWithSpeedKit: isClone,
      activityTimeout: params.activityTimeout,
      skipPrewarm: params.skipPrewarm,
      preload: params.preload,
      whitelist: params.whitelist,
      ignoreConfig: params.ignoreConfig,
      testOptions: this.testBuilder.buildOptions(params, url, isClone, commandLine),
      cookie: params.cookie,
      navigateUrls: params.navigateUrls,
    }
  }
}
