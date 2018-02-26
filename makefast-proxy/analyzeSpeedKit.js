/* eslint-disable no-restricted-syntax, no-console */
const path = require('path');
const URL = require('url');
const chalk = require('chalk');
const fetch = require('node-fetch');
const { padRight, padLeft, formatMicro } = require('./utils');

const cacheDisabled = true;

async function evaluateSpeedKit(url) {
  if (!url) {
    return null;
  }

  const response = await fetch(url);
  const text = await response.text();
  const match = text.match(/\/\* ! speed-kit (\d+\.\d+\.\d+) | Copyright \(c\) \d+ Baqend GmbH \*\//);
  if (!match) {
    return null;
  }

  const [, version] = match;
  return { url, version };
}

/**
 * @param {Array<Promise<T | null>>} promises
 * @return {Promise<T>}
 * @template T
 */
function raceNonNullPromise(promises) {
  let unresolved = true;
  return new Promise((resolve, reject) => {
    for (const promise of promises) {
      promise.then((result) => {
        if (unresolved && result !== null) {
          unresolved = false;
          resolve(result);
        }
      });
    }

    Promise.all(promises)
      .then(() => reject(new Error('No non-null candidate existed.')))
      .catch(() => reject(new Error('No non-null candidates resolved.')));
  });
}

/**
 * @param client
 * @param {string} url
 * @return {Promise<{}>}
 */
async function analyzeSpeedKit(client, url) {
  // Extract used DevTools domains.
  const {
    Network, Page, Runtime, ServiceWorker,
  } = client;

  /**
   * Evaluates the Speed Kit config.
   *
   * @return {Promise<*>}
   */
  async function evaluateSpeedKitConfig() {
    const { result: { value } } = await Runtime.evaluate({
      expression: 'caches.match(\'/com.baqend.speedkit.config\').then(it => it.statusText)',
      awaitPromise: true,
    });

    return value ? JSON.parse(value) : null;
  }

  let http2 = false;
  let speedKitUrl = null;

  // Setup handlers
  Network.responseReceived(({ type, timestamp, response }) => {
    http2 = http2 || response.protocol === 'h2';
    const reqUrl = URL.parse(response.url);
    console.log(chalk`{gray [Network      ]} {yellow ${formatMicro(timestamp)}} {bold ${padLeft(type)}} ${path.basename(reqUrl.pathname)}`);
  });

  ServiceWorker.workerRegistrationUpdated(({ registrations }) => {
    for (const registration of registrations) {
      const { registrationId, scopeURL, isDeleted } = registration;
      console.log(chalk`{gray [ServiceWorker]} {cyan [SW ${registrationId}]} ${isDeleted ? '[    deleted]' : '[not deleted]'} Registration for ${scopeURL}`);
    }
  });

  ServiceWorker.workerVersionUpdated(({ versions }) => {
    for (const version of versions) {
      if ('targetId' in version) {
        const {
          versionId, registrationId, scriptURL, status, runningStatus,
        } = version;
        speedKitUrl = speedKitUrl || scriptURL;
        console.log(chalk`{gray [ServiceWorker]} {cyan [SW ${registrationId}]} ${padRight(runningStatus, '        ')} {bold ${padRight(status, '          ')}}  #${versionId} ${scriptURL}`);
      }
    }
  });

  const loadEventFired = new Promise((resolve) => {
    Page.loadEventFired(async ({ timestamp }) => {
      console.log(chalk`{gray [Page Event   ]} {yellow ${formatMicro(timestamp)}} Load`);
      resolve(await evaluateSpeedKitConfig());
    });
  });

  const domContentEventFired = new Promise((resolve) => {
    Page.domContentEventFired(async ({ timestamp }) => {
      console.log(chalk`{gray [Page Event   ]} {yellow ${formatMicro(timestamp)}} DOMContentLoaded`);
      resolve(await evaluateSpeedKitConfig());
    });
  });

  // Enable events then start!
  await Promise.all([
    ServiceWorker.enable(),
    Network.enable(),
    Page.enable(),
    Runtime.enable(),
  ]);

  // Disable caching
  await Network.setCacheDisabled({ cacheDisabled });
  console.log(chalk`{gray [Network      ]} Caching is now ${cacheDisabled ? chalk.red('disabled') : chalk.green('enabled')}`);

  // Navigate to test site
  const navigate = new Promise(async (resolve) => {
    await Page.navigate({ url });
    resolve(await evaluateSpeedKitConfig());
  });

  // Await matching config
  const config = await raceNonNullPromise([
    loadEventFired,
    domContentEventFired,
    navigate,
  ]);
  console.log('Config', config);
  if (!config) {
    throw new Error('Server has no Speed Kit installed');
  }

  // Retrieve information about Speed Kit
  const speedKit = await evaluateSpeedKit(speedKitUrl);

  return { config, http2, speedKit };
}

exports.analyzeSpeedKit = analyzeSpeedKit;
