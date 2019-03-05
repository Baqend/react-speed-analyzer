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
  private buildForCompetitorTest(
    url: string,
    appName: string | null,
    location: string,
    isMobile: boolean,
    activityTimeout: number,
    timeout: number
  ): TestScript {
    if (/https:\/\/\w*:\w*@oleo.io/.test(url)) {
      activityTimeout = 5000;
    }

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

    if (isMobile) {
      ts.setViewport(480, 987); // Maximum viewport
    } else {
      ts.setViewport(1024, 1050); // Good desktop viewport
    }

    // Hack to circumvent zip code protection for "shop.rewe.de"
    if (url.startsWith('https://shop.rewe.de/')) {
      // Cookies to choose a marked
      ts.setCookie('marketsCookie=%7B%22marketId%22%3A%22540622%22%2C%22zipCode%22%3A%2225337%22%2C%22serviceTypes%22%3A%5B%22PICKUP%22%5D%2C%22customerZipCode%22%3A%2225337%22%2C%22marketZipCode%22%3A%2225336%22%7D', 'https://shop.rewe.de/');
      ts.setCookie('cookie-consent=1', 'https://shop.rewe.de/');
    }

    ts.blockDomains(...blockDomains)
      .setActivityTimeout(activityTimeout)
      .setTimeout(timeout)
      .navigate(url)

    return ts
  }

  /**
   * @param url             The competitor's URL to test.
   * @param appName         The name of the app to be blocked.
   * @param speedKitConfig  The Speed Kit config.
   * @param location        The location where the test is executed.
   * @param isMobile        true if the mobile site is tested, false otherwise.
   * @param activityTimeout The activity timeout.
   * @param timeout         The timeout.
   * @return                The created Web Page Test script.
   */
  private buildForSpeedKitTest(
    url: string,
    appName: string | null,
    speedKitConfig: string,
    location: string,
    isMobile: boolean,
    activityTimeout: number,
    timeout: number,
  ): TestScript {
    const basicAuthRegex = /\w*:\w*@/;
    if (basicAuthRegex.test(url)) {
        url = url.replace(basicAuthRegex, '')
    }

    // Edit split criterion id necessary to ensure SK is active for test run.
    const splitRegex = /.*split:.\d+\.\d*[^,]/;
    if (splitRegex.test(speedKitConfig)) {
      speedKitConfig = speedKitConfig.replace(splitRegex, 'split: 1.0')
    }

    if(url.startsWith("https://mobile.yoox.com")) {
      url = url.substr(0, url.indexOf('#'))
    }

    if (url.startsWith("https://oleo.io")) {
      activityTimeout = 5000
      speedKitConfig = `{  
   "appName":"little-dragon-72",
   "enabledSites":[  
      {  
         "pathname":[  
            "/land_2/Lackierung",
            "/preise",
            "/partners",
            "/überuns"
         ]
      }
   ],
   "whitelist":[  
      {  
         "host":[  
            "caroobi.com",
            "oleo.io",
            "fonts.googleapis.com",
            "fonts.gstatic.com",
            "static.hotjar.com",
            "script.hotjar.com",
            "vars.hotjar.com",
            "static.criteo.net",
            "d34zngbna5us75.cloudfront.net",
            "s3-eu-west-1.amazonaws.com"
         ]
      },
      {  
         "url":[  
            "www.google-analytics.com/analytics.js"
         ]
      }
   ],
   "blacklist":[  
      {  
         "pathname":[  
            "/mistri_info",
            "/mistri_funnel",
            "/foc_checkout_v4",
            "/checkout"
         ]
      }
   ]
}`;
    }

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

    if (isMobile) {
      ts.setViewport(480, 987); // Maximum viewport
    } else {
      ts.setViewport(1024, 1050); // Good desktop viewport
    }

    ts.setActivityTimeout(activityTimeout)
      .logData(false)
      .setTimeout(timeout)
      .setDns(hostname!, credentials.makefast_ip)
      .navigate(installSpeedKitUrl)

    // FIXME when using the shield pop, h2 is not supported anymore.
    // if (!appName) {
      // ts.setDns(`${credentials.app}.app.baqend.com`, credentials.shield_pop_ip)
    // }

    // Hack to make "decathlon.de" testable.
    if (!location.includes('-docker') || url.indexOf('decathlon.de') !== -1) {
      ts.navigate('http://127.0.0.1:8888/orange.html')
    }

    // Hack to circumvent zip code protection for "shop.rewe.de"
    if (url.startsWith('https://shop.rewe.de/')) {
      // Cookies to choose a marked
      ts.setCookie('marketsCookie=%7B%22marketId%22%3A%22540622%22%2C%22zipCode%22%3A%2225337%22%2C%22serviceTypes%22%3A%5B%22PICKUP%22%5D%2C%22customerZipCode%22%3A%2225337%22%2C%22marketZipCode%22%3A%2225336%22%7D', 'https://shop.rewe.de/');
      ts.setCookie('cookie-consent=1', 'https://shop.rewe.de/');
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
      return this.buildForSpeedKitTest(url, appName, speedKitConfig, location, isMobile, activityTimeout, timeout).toString()
    }

    return this.buildForCompetitorTest(url, appName, location, isMobile, activityTimeout, timeout).toString()
  }
}
