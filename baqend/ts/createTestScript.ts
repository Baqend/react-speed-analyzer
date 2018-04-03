import URL from 'url'
import credentials from './credentials'

const DEFAULT_TIMEOUT = 30
const DEFAULT_ACTIVITY_TIMEOUT = 75

export interface SpeedKitConfig {
  appName: string
  appDomain?: string
}

export type SpeedKitConfigArgument = string | SpeedKitConfig | null

/**
 * @param url             The competitor's URL to test.
 * @param speedKitConfig  The Speed Kit config.
 * @param activityTimeout The activity timeout.
 * @param timeout         The timeout.
 * @return                The created Web Page Test script.
 */
function createCompetitorTestScript(url: string, speedKitConfig: SpeedKitConfigArgument, {
  activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
  timeout = DEFAULT_TIMEOUT,
}): string {
  let blockDomains = null
  if (speedKitConfig !== null && typeof speedKitConfig !== 'string') {
    if (speedKitConfig.appDomain) {
      blockDomains = speedKitConfig.appDomain
    } else {
      blockDomains = `${speedKitConfig.appName}.app.baqend.com`
    }
  }

  return `
    ${blockDomains ? `blockDomains ${blockDomains}` : ''}
    setActivityTimeout ${activityTimeout}
    setTimeout ${timeout}
    navigate ${url}
  `
}

/**
 * @param url             The competitor's URL to test.
 * @param speedKitConfig  The Speed Kit config.
 * @param activityTimeout The activity timeout.
 * @param timeout         The timeout.
 * @return                The created Web Page Test script.
 */
function createSpeedKitTestScript(url: string, speedKitConfig: SpeedKitConfigArgument, {
  activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
  timeout = DEFAULT_TIMEOUT,
}): string {
  const config = typeof speedKitConfig !== 'string' ? JSON.stringify(speedKitConfig) : speedKitConfig
  let host;
  let hostname;
  let protocol;
  try {
    ({ host, hostname, protocol } = URL.parse(url));
  } catch (e) {
    throw new Abort(`Invalid Url specified: ${e.message}`);
  }

  // The URL to call to install the SW
  const installSpeedKitUrl = URL.format({
    protocol,
    host,
    pathname: '/install-speed-kit',
    search: `config=${encodeURIComponent(config)}`
  });

  // SW always needs to be installed
  return `
    setActivityTimeout ${activityTimeout}
    
    logData 0
    setTimeout ${timeout}
    setDns ${hostname} ${credentials.makefast_ip}
    navigate ${installSpeedKitUrl}
    
    navigate about:blank
    logData 1
    setTimeout ${timeout}
    navigate ${url}
  `;
}

/**
 * Creates a Web Page Test script to execute.
 *
 * @param url                   The URL to create the test script for.
 * @param isTestWithSpeedKit    Whether to test with Speed Kit enabled.
 * @param isSpeedKitComparison  Whether the competitor is running Speed Kit.
 * @param speedKitConfig        The serialized speedkit config string.
 * @param activityTimeout       The activity timeout.
 * @param timeout               The timeout.
 * @return                      The created Web Page Test script.
 */
export function createTestScript(
  url: string,
  isTestWithSpeedKit: boolean,
  isSpeedKitComparison: boolean,
  speedKitConfig: SpeedKitConfigArgument,
  activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
  timeout = DEFAULT_TIMEOUT,
): string {

  // Resolve Speed Kit config
  if (isTestWithSpeedKit) {
    if (!speedKitConfig) {
      throw new Error('Empty Speed Kit Config')
    }
    return createSpeedKitTestScript(url, speedKitConfig, { activityTimeout, timeout })
  }

  return createCompetitorTestScript(url, speedKitConfig, { activityTimeout, timeout })
}
