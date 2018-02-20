/* eslint-disable comma-dangle */
/* global Abort */
const URL = require('url');
const credentials = require('./credentials');

const DEFAULT_TIMEOUT = 30;
const DEFAULT_ACTIVITY_TIMEOUT = 75;

/**
 * @param {string} url              The competitor's URL to test.
 * @param {object} speedKitConfig   The Speed Kit config.
 * @param {number} activityTimeout  The activity timeout.
 * @param {number} timeout          The timeout.
 * @return {string}                 The created Web Page Test script.
 */
function createCompetitorTestScript(url, speedKitConfig, {
  activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
  timeout = DEFAULT_TIMEOUT,
}) {
  let blockDomains = null;
  if (speedKitConfig !== null && typeof speedKitConfig !== 'string') {
    if (speedKitConfig.appDomain) {
      blockDomains = speedKitConfig.appDomain;
    } else {
      blockDomains = `${speedKitConfig.appName}.app.baqend.com`;
    }
  }

  return `
    ${blockDomains ? `blockDomains ${blockDomains}` : ''}
    setActivityTimeout ${activityTimeout}
    setTimeout ${timeout}
    navigate ${url}
  `;
}

/**
 * @param {string} url              The competitor's URL to test.
 * @param {object} speedKitConfig   The Speed Kit config.
 * @param {number} activityTimeout  The activity timeout.
 * @param {number} timeout          The timeout.
 * @return {string}                 The created Web Page Test script.
 */
function createSpeedKitTestScript(url, speedKitConfig, {
  activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
  timeout = DEFAULT_TIMEOUT,
}) {
  const isSpeedKitComparison = typeof speedKitConfig !== 'string' && speedKitConfig !== null;
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
    search: `config=${encodeURIComponent(isSpeedKitComparison ? JSON.stringify(speedKitConfig) : speedKitConfig)}`
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
 * @param {string} url                    The URL to create the test script for.
 * @param {boolean} isTestWithSpeedKit    Whether to test with Speed Kit enabled.
 * @param {boolean} isSpeedKitComparison  Whether the competitor is running Speed Kit.
 * @param {string} speedKitConfig         The serialized speedkit config string.
 * @param {number} activityTimeout        The activity timeout.
 * @param {number} timeout                The timeout.
 * @return {string}                       The created Web Page Test script.
 */
function createTestScript(
  url,
  isTestWithSpeedKit,
  isSpeedKitComparison,
  speedKitConfig,
  activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
  timeout = DEFAULT_TIMEOUT
) {

  // Resolve Speed Kit config
  if (isTestWithSpeedKit) {
    if (!speedKitConfig) {
      throw new Error('Empty Speed Kit Config');
    }
    return createSpeedKitTestScript(url, speedKitConfig, { activityTimeout, timeout });
  }

  return createCompetitorTestScript(url, speedKitConfig, { activityTimeout, timeout });
}

exports.createTestScript = createTestScript;
