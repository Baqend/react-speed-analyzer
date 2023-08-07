import { model } from 'baqend'
import { MultiTestParams, Priority, TestParams } from './_TestParams'
import credentials from './credentials'

export const DEFAULT_SINGLE_PRIORITY = Priority.HIGHEST
export const DEFAULT_BULK_PRIORITY = Priority.LOWEST
export const DEFAULT_PLESK_PRIORITY = Priority.LESS_HIGH
export const DEFAULT_LOCATION = 'eu-central-1-docker:Chrome.FIOSNoLatency'
export const DEFAULT_ACTIVITY_TIMEOUT = 5000
export const DEFAULT_TIMEOUT = 30
// Extension id of "I still don't care about cookies"
export const DEFAULT_EXTENSIONS = 'edibdbjcniadpccecjdfdjjppcpchdlm'

/**
 * The default test params.
 */
export const DEFAULT_PARAMS: Required<TestParams> = {
  url: '',
  whitelist: '',
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
  hostname: '',
  navigateUrls: [],
  withScraping: false,
}

/**
 * The default test options.
 */
export const DEFAULT_TEST_OPTIONS: Partial<model.TestOptions> = {
  runs: 1,
  video: true,
  noopt: true,
  pageSpeed: false,
  requests: true,
  breakDown: false,
  domains: false,
  bodies: false,
  keepua: true,
  tcpDump: false,
  timeline: true,
  time: 1, // capture at least one second
  chromeTrace: false,
  netLog: false,
  noheaders: false,
  noimages: true,
  ignoreSSL: true,
  block: 'favicon', // exclude favicons for fair comparison, as not handled by SWs
  iq: 100,
  extensions: DEFAULT_EXTENSIONS,
  timeout: 2 * DEFAULT_TIMEOUT,
  custom: `[speedKit]
  function getConfig() {
    return new Promise(function(resolve) {
      try {
        var indexedDB = window.indexedDB;
        if (!indexedDB) {
          resolve(null);
          return;
        }

        var open = indexedDB.open('baqend-speedkit', 1);
        open.onerror = function () {
          resolve(null);
        };

        open.onsuccess = function() {
          var db = open.result;
          if (!db.objectStoreNames.contains('baqend-speedkit-store')) {
              db.close();
              resolve(null);
              return;
          }
          
          var tx = db.transaction('baqend-speedkit-store', 'readonly');
          var store = tx.objectStore('baqend-speedkit-store');
          var getKey = store.get('/com.baqend.speedkit.config');

          getKey.onsuccess = function() {
            resolve(normalizeData(getKey.result));
          };

          tx.onerror = function () {
            resolve(null);
          };

          tx.oncomplete = function () {
            db.close();
          };
        };
      } catch(e) {
        resolve(null);
      }
    });
  }
  function normalizeData(data) {
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }

    if (data instanceof Array) {
      return data.map(datum => normalizeData(datum));
    }

    if (data instanceof RegExp) {
      return 'regexp:/' + data.source + '/' + data.flags;
    }

    if (typeof data === 'object' && data !== null) {
      const obj = Object.create(null);
      for (const [key, value] of Object.entries(data)) {
        obj[key] = normalizeData(value);
      }
      return obj;
    }

    return null;
  }
  if (!!window.speedKit) {
    return normalizeData(window.speedKit);
  }
  return getConfig();
  [serviceWorker]
  return navigator.serviceWorker.controller.scriptURL;
  `
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
