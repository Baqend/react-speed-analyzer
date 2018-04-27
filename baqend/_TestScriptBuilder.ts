import { format, parse } from 'url'
import { DEFAULT_ACTIVITY_TIMEOUT, DEFAULT_TIMEOUT } from './_TestBuilder'
import { TestScript, testScript } from './_TestScript'
import credentials from './credentials'

export class TestScriptBuilder {
  /**
   * @param url             The competitor's URL to test.
   * @param appName         The name of the app to be blocked.
   * @param location        The location where the test is executed.
   * @param activityTimeout The activity timeout.
   * @param timeout         The timeout.
   * @return                The created Web Page Test script.
   */
  private buildForCompetitorTest(url: string, appName: string|null, location: string, activityTimeout: number, timeout: number): TestScript {
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

    return testScript()
      .blockDomains(...blockDomains)
      .setActivityTimeout(activityTimeout)
      .setTimeout(timeout)
      .navigate(url)
  }

  /**
   * @param url             The competitor's URL to test.
   * @param speedKitConfig  The Speed Kit config.
   * @param location        The location where the test is executed.
   * @param activityTimeout The activity timeout.
   * @param timeout         The timeout.
   * @return                The created Web Page Test script.
   */
  private buildForSpeedKitTest(url: string, speedKitConfig: string, location: string, activityTimeout: number, timeout: number): TestScript {
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
      .setActivityTimeout(activityTimeout)

      .logData(false)
      .setTimeout(timeout)
      .setDns(hostname!, credentials.makefast_ip)
      .navigate(installSpeedKitUrl)

    if (!location.includes('eu-central-1-')) {
      ts.navigate('about:blank')
    }

    return ts
      .logData(true)
      .navigate(url)
  }

  /**
   * Adds to a test script the logic to clear the browser's content.
   */
  private clearBrowserContent(testScript: TestScript, location: string) {
    if (location.includes('eu-central-1-')) {
      return testScript
        .navigate(`http://localhost:8888/orange.html`)
        .sleep(10)
    }

    return testScript
      .navigate('about:blank')
  }

  /**
   * Creates a Web Page Test script to execute.
   *
   * @param url                   The URL to create the test script for.
   * @param isTestWithSpeedKit    Whether to test with Speed Kit enabled.
   * @param speedKitConfig        The serialized speedkit config string.
   * @param location              The location where the test is executed.
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
    activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
    appName: string|null = null,
    timeout = DEFAULT_TIMEOUT,
  ): string {
    // Resolve Speed Kit config
    if (isTestWithSpeedKit) {
      return this.buildForSpeedKitTest(url, speedKitConfig, location, activityTimeout, timeout).toString()
    }

    return this.buildForCompetitorTest(url, appName, location, activityTimeout, timeout).toString()
  }
}
