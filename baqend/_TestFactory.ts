import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { TestBuilder } from './_TestBuilder'
import { TestParams } from './_TestParams'
import { UrlInfo } from './_UrlInfo'

/**
 * Creates TestResult objects, that have all the information needed in order to be processed by the TestWorker.
 */
export class TestFactory implements AsyncFactory<model.TestResult> {
  constructor(
    private readonly db: baqend,
    private readonly testBuilder: TestBuilder,
  ) {}

  create(urlInfo: UrlInfo, isClone: boolean, params: Required<TestParams>): Promise<model.TestResult> {
    const { url } = urlInfo
    const { priority, speedKitConfig } = params
    const commandLine = this.createCommandLineFlags(url, isClone)
    if (commandLine) {
      this.db.log.info('flags: %s', commandLine)
    }

    const testInfo = this.createTestInfo(urlInfo, isClone, params)

    const testResult = new this.db.TestResult({
      url,
      isClone,
      priority,
      speedKitConfig,
      testInfo,
      hasFinished: false,
      webPagetests: [],
    })

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
  createTestInfo(urlInfo: UrlInfo, isClone: boolean, params: Required<TestParams>): model.TestInfo {
    const commandLine = this.createCommandLineFlags(urlInfo.url, isClone)
    if (commandLine) {
      this.db.log.info('flags: %s', commandLine)
    }

    return {
      url: urlInfo.url,
      isSpeedKitComparison: urlInfo.speedKitEnabled,
      isTestWithSpeedKit: isClone,
      activityTimeout: params.activityTimeout,
      skipPrewarm: params.skipPrewarm,
      testOptions: this.testBuilder.buildOptions(params, commandLine),
    }
  }
}
