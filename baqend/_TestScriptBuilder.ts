import { format, parse } from 'url'
import { DEFAULT_ACTIVITY_TIMEOUT, DEFAULT_TIMEOUT } from './_TestBuilder'
import { TestScript, testScript } from './_TestScript'
import credentials from './credentials'

export class TestScriptBuilder {
  /**
   * @param url             The competitor's URL to test.
   * @param appName         The name of the app to be blocked.
   * @param location        The location where the test is executed.
   * @param isMobile        true if the mobile site is tested, false otherwise.
   * @param activityTimeout The activity timeout.
   * @param timeout         The timeout.
   * @return                The created Web Page Test script.
   */
  private buildForCompetitorTest(url: string, appName: string | null, location: string, isMobile: boolean, activityTimeout: number, timeout: number): TestScript {
    const blockDomains: string[] = []
    if (appName) {
      blockDomains.push(`${appName}.app.baqend.com`)
    }

    /*if (speedKitConfig !== null && typeof speedKitConfig !== 'string') {
      if (speedKitConfig.appDomain) {
        blockDomains.push(speedKitConfig.appDomain)
      } else {
        blockDomains.push(`${speedKitConfig.appName}.app.baqend.com`)
      }
    }*/

    const ts = testScript()

    if (location.includes('-docker')) { // FIXME this is just testing, set optimal viewport when testing is finished.
      // if (isMobile) {
      //   ts.setViewport(480, 987); // Maximum viewport
      // } else {
      //   ts.setViewport(1024, 1050); // Good desktop viewport
      // }
    }

    ts.blockDomains(...blockDomains)
      .setActivityTimeout(activityTimeout)
      .setTimeout(timeout)
      .navigate(url)

    return ts
  }

  /**
   * @param url             The competitor's URL to test.
   * @param speedKitConfig  The Speed Kit config.
   * @param location        The location where the test is executed.
   * @param isMobile        true if the mobile site is tested, false otherwise.
   * @param activityTimeout The activity timeout.
   * @param timeout         The timeout.
   * @return                The created Web Page Test script.
   */
  private buildForSpeedKitTest(url: string, speedKitConfig: string, location: string, isMobile: boolean, activityTimeout: number, timeout: number): TestScript {
    const { host, hostname, protocol } = parse(url)

    // The URL to call to install the SW
    const installSpeedKitUrl = format({
      protocol,
      host,
      pathname: '/install-speed-kit',
      search: `config=${encodeURIComponent(speedKitConfig)}`,
    })


    // SW always needs to be installed
    const ts = testScript()

    if (location.includes('-docker')) { // FIXME this is just testing, set optimal viewport when testing is finished.
      // if (isMobile) {
      //   ts.setViewport(480, 987); // Maximum viewport
      // } else {
      //   ts.setViewport(1024, 1050); // Good desktop viewport
      // }
    }

    ts.setActivityTimeout(activityTimeout)
      .logData(false)
      .setTimeout(timeout)
      .setDns(hostname!, credentials.makefast_ip)
      .navigate(installSpeedKitUrl)

    if (!location.includes('-docker')) {
      ts.navigate('about:blank')
    }

    return ts
      .logData(true)
      .navigate(url)
  }

  /**
   * Creates a Web Page Test script to execute.
   *
   * @param url                   The URL to create the test script for.
   * @param isTestWithSpeedKit    Whether to test with Speed Kit enabled.
   * @param speedKitConfig        The serialized speedkit config string.
   * @param location              The location where the test is executed.
   * @param isMobile              true if the mobile site is tested, false otherwise.
   * @param activityTimeout       The activity timeout.
   * @param appName               The name of the baqend app.
   * @param timeout               The timeout.
   * @return                      The created Web Page Test script.
   */
  createTestScript(
    url: string,
    isTestWithSpeedKit: boolean,
    speedKitConfig: string,
    location: string,
    isMobile: boolean = false,
    activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
    appName: string | null = null,
    timeout = DEFAULT_TIMEOUT,
  ): string {
    // Resolve Speed Kit config
    if (isTestWithSpeedKit) {
      return this.buildForSpeedKitTest(url, speedKitConfig, location, isMobile, activityTimeout, timeout).toString()
    }

    return this.buildForCompetitorTest(url, appName, location, isMobile, activityTimeout, timeout).toString()
  }
}
