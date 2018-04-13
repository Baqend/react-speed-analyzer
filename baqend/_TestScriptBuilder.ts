import { format, parse } from 'url'
import { DEFAULT_ACTIVITY_TIMEOUT, DEFAULT_TIMEOUT } from './_TestBuilder'
import { TestScript, testScript } from './_TestScript'
import credentials from './credentials'

export class TestScriptBuilder {
  /**
   * @param url             The competitor's URL to test.
   * @param speedKitConfig  The Speed Kit config.
   * @param activityTimeout The activity timeout.
   * @param timeout         The timeout.
   * @return                The created Web Page Test script.
   */
  private buildForCompetitorTest(url: string, speedKitConfig: string, activityTimeout: number, timeout: number): TestScript {
    const blockDomains: string[] = []
    /*if (speedKitConfig !== null && typeof speedKitConfig !== 'string') {
      if (speedKitConfig.appDomain) {
        blockDomains.push(speedKitConfig.appDomain)
      } else {
        blockDomains.push(`${speedKitConfig.appName}.app.baqend.com`)
      }
    }*/

    return testScript()
      .blockDomains(...blockDomains)
      .setActivityTimeout(activityTimeout)
      .setTimeout(timeout)
      .navigate(url)
  }

  /**
   * @param url             The competitor's URL to test.
   * @param speedKitConfig  The Speed Kit config.
   * @param activityTimeout The activity timeout.
   * @param timeout         The timeout.
   * @return                The created Web Page Test script.
   */
  private buildForSpeedKitTest(url: string, speedKitConfig: string, activityTimeout: number, timeout: number): TestScript {
    const { host, hostname, protocol } = parse(url)

    // The URL to call to install the SW
    const installSpeedKitUrl = format({
      protocol,
      host,
      pathname: '/install-speed-kit',
      search: `config=${encodeURIComponent(speedKitConfig)}`,
    })

    // SW always needs to be installed
    return testScript()
      .setActivityTimeout(activityTimeout)

      .logData(false)
      .setTimeout(timeout)
      .setDns(hostname!, credentials.makefast_ip)
      .navigate(installSpeedKitUrl)

      .navigate('about:blank')
      .logData(true)
      .setTimeout(timeout)
      .navigate(url)
  }

  /**
   * Creates a Web Page Test script to execute.
   *
   * @param url                   The URL to create the test script for.
   * @param isTestWithSpeedKit    Whether to test with Speed Kit enabled.
   * @param speedKitConfig        The serialized speedkit config string.
   * @param activityTimeout       The activity timeout.
   * @param timeout               The timeout.
   * @return                      The created Web Page Test script.
   */
  createTestScript(
    url: string,
    isTestWithSpeedKit: boolean,
    speedKitConfig: string,
    activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
    timeout = DEFAULT_TIMEOUT,
  ): string {
    // Resolve Speed Kit config
    if (isTestWithSpeedKit) {
      return this.buildForSpeedKitTest(url, speedKitConfig, activityTimeout, timeout).toString()
    }

    return this.buildForCompetitorTest(url, speedKitConfig, activityTimeout, timeout).toString()
  }
}
