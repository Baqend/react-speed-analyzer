import fetch, { Response } from 'node-fetch'
import { format, parse } from 'url'
import { toUnicode } from 'punycode'
import { baqend } from 'baqend'

const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_0_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13A452 Safari/601.1 PTST/396';

/**
 * Info retrieved from pages.
 */
interface SpeedKitInfo {
  enabled: boolean
  speedKitVersion: string | null
  swUrl: string | null
}

interface ResultInfo {
  url: string
  displayUrl: string
  type: string | null
  secured: boolean
  mobile: boolean
}

type Result = SpeedKitInfo & ResultInfo

type OptResult = Result | null

/**
 * Analyzes the website's type.
 *
 * @param {Response} response
 */
async function analyzeType(response: Response): Promise<string | null> {
  const via = response.headers.get('via');
  if (via === 'baqend' || response.url.includes('www.baqend.com')) {
    return Promise.resolve('baqend');
  }

  const xGenerator = response.headers.get('x-generator');
  if (xGenerator && xGenerator.toLocaleLowerCase().includes('sulu')) {
    return Promise.resolve('sulu');
  }

  if (response.headers.has('x-wix-request-id') || response.headers.has('x-wix-route-id')) {
    return Promise.resolve('wix');
  }

  if (response.headers.has('x-host') && response.headers.get('x-host')!.includes('weebly.net')) {
    return Promise.resolve('weebly');
  }

  if (response.headers.has('x-jimdo-instance')) {
    return Promise.resolve('jimdo');
  }

  const text = await response.text()
  const result = /<meta\s+name=["']generator["']\s*content=["']([^"']+)["']/i.exec(text);
  if (result) {
    const [, generator] = result;
    const s = generator.toLocaleLowerCase();
    if (s.includes('joomla')) {
      return 'joomla';
    }
    if (s.includes('wordpress')) {
      return 'wordpress';
    }
    if (s.includes('drupal')) {
      return 'drupal';
    }
    if (s.includes('typo3')) {
      return 'typo3';
    }
  }

  if (text.includes('<!-- This is Squarespace. -->')) {
    return 'squarespace';
  }

  return null;
}

/**
 * @param swUrl The Service Worker URL to look for Speed Kit.
 * @return An info object.
 */
async function fetchServiceWorkerUrl(swUrl: string): Promise<SpeedKitInfo> {
  const error = { enabled: false, speedKitVersion: null, swUrl: null }
  try {
    const res = await fetch(swUrl)
    if (!res.ok) {
      return error
    }

    const text = await res.text()
    const matches = /\/\* ! speed-kit ([\d.]+) \|/.exec(text)
    if (matches) {
      const [, speedKitVersion] = matches
      return { enabled: true, speedKitVersion, swUrl }
    }

    return error
  } catch (e) {
    return error
  }
}

/**
 * @param db The Baqend instance.
 * @param url The URL to test for Speed Kit.
 * @param isWordPress Whether this is a WordPress instance.
 * @return A Speed Kit info object.
 */
async function testForSpeedKit(db: baqend, url: string, isWordPress: boolean): Promise<SpeedKitInfo> {
  const parsedUrl = parse(url)
  const paths = isWordPress ? parsedUrl.path!.split('/').filter(path => path) : []
  paths.unshift(parsedUrl.host!)

  const promises = paths.map((path, index) => {
    const subPath = paths.slice(0, index + 1).join('/')
    const swUrl = parsedUrl.protocol + '//' + subPath + '/sw.js'

    return fetchServiceWorkerUrl(swUrl)
  })

  const speedKitData = await Promise.all(promises)
  const enabledUrls = speedKitData.filter(speedKit => speedKit.enabled)
  if (enabledUrls.length > 0) {
    db.log.info(`Speed Kit found on URL ${enabledUrls[0].swUrl} with version ${enabledUrls[0].speedKitVersion}`)
    return enabledUrls[0]
  }

  db.log.info(`No Speed Kit found for URL ${url}`)

  return { enabled: false, speedKitVersion: null, swUrl: null }
}

/**
 * @param {string} url
 * @return {string}
 */
function urlToUnicode(url: string): string {
  const { hostname, protocol, search, query, port, pathname } = parse(url)
  const obj = { hostname: toUnicode(hostname!), protocol, search, query, port, pathname }

  return format(obj)
}

/**
 * @param url The URL to fetch.
 * @param mobile Whether to fetch the mobile variant of the site.
 * @param db The Baqend instance.
 * @param redirectsPerformed The count of redirects performed so far.
 * @param isRetry
 * @return The optional result
 */
async function fetchUrl(url: string, mobile: boolean, db: baqend, redirectsPerformed: number = 0, isRetry: boolean = false): Promise<Result | null> {
  db.log.info(`Analyzing ${url}`, { mobile, redirectsPerformed, url })
  const headers: { [index: string]: string } = mobile ? { 'user-agent': MOBILE_USER_AGENT } : {}

  try {
    const response = await fetch(url, { redirect: 'manual', headers, timeout: 12000 })
    if (response.status >= 400) {
      throw new Error(`Status Code of Response is ${response.status} or higher.`)
    }

    // Redirect if location header found and redirect url is not equal origin url.
    const location = response.headers.get('location')
    if (location && location !== url) {
      if (redirectsPerformed > 20) {
        throw new Abort('The URL resolves in too many redirects.')
      }

      db.log.info(`Found redirect from ${url} to ${location}`, { mobile, redirectsPerformed, url })
      return fetchUrl(location, mobile, db, redirectsPerformed + 1)
    }

    // Retrieve properties of that domain
    const secured = url.startsWith('https://')
    const displayUrl = urlToUnicode(url)
    const type = await analyzeType(response)
    const resultInfo: ResultInfo = { url, mobile, displayUrl, type, secured }
    const speedKit = await testForSpeedKit(db, url, type === 'wordpress')

    return { ...resultInfo, ...speedKit }
  } catch (error) {
    const hasWWW = url.indexOf('www') !== -1
    if (!hasWWW && !isRetry) {
      db.log.info(`Start fetching retry with www for url ${url} in analyzeURL.`)
      const editUrl = url.replace('://', '://www.')
      return fetchUrl(editUrl, mobile, db, redirectsPerformed, true)
    }

    db.log.warn(`Error while fetching ${url} in analyzeURL: ${error.stack}`)
    return null
  }
}

/**
 * @param query The URL to add a schema to.
 * @return An array of URLs with schema.
 */
function addSchema(query: string): string[] {
  if (/^https?:\/\//.test(query)) {
    return [query];
  }

  return [`https://${query}`, `http://${query}`];
}

/**
 * @param {Array<Promise<null|T>>} resultPromises The results to race.
 * @return {Promise<null|T>} The best raced result.
 * @type T The result type.
 */
function raceBestResult(resultPromises: Array<Promise<OptResult>>): Promise<OptResult> {
  return new Promise((resolveOuter) => {
    const promises = resultPromises.map(p => p.then((result) => {
      if (result && result.secured) {
        resolveOuter(result);
        return null;
      }

      return result;
    }));

    // Fallback to best matching result
    Promise.all(promises).then(results => results.reduce((p, r) => p || r, null)).then(resolveOuter);
  });
}

/**
 * Analyzes a single result.
 *
 * @param query The URL to test.
 * @param db The Baqend instance.
 * @param mobile Whether to fetch the mobile variant of the site.
 * @return A promise which resolves with the analysis's result.
 * @template Result
 */
export function analyzeUrl(query: string, db: baqend, mobile: boolean = false): Promise<OptResult> {
  const urlsToTest = addSchema(query)
  const fetchPromises = urlsToTest.map(url => fetchUrl(url, mobile, db))

  // Race for the best result
  return raceBestResult(fetchPromises).then(result => {
    if (!result) {
      db.log.error(`NormalizeUrl failed.`, { query, mobile, result })
    }
    return result
  })
}

/**
 * Wraps a promise to be used in a map.
 */
function forMap<K, V>(key: K, deferredValue: Promise<V>): Promise<[K, V]> {
  return deferredValue.then(value => [key, value] as [K, V])
}

/**
 * Analyzes a bunch of URLs.
 * The result is given in a Map returning a result for each query sent.
 *
 * @param queries The URLs to test.
 * @param db The Baqend instance.
 * @param mobile Whether to fetch the mobile variant of the site.
 * @return A promise which resolves with the analysis's result map.
 * @template Result
 */
export async function analyzeUrls(queries: string[], db: baqend, mobile: boolean = false): Promise<Map<string, OptResult>> {
  const promises = queries.map(query => forMap(query, analyzeUrl(query, db, mobile)))
  const map = await Promise.all(promises)

  return new Map(map)
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, { urls, mobile }: { urls: string | string[], mobile?: boolean | string }) {
  const concatUrls = ([] as string[]).concat(urls)
  const map = await analyzeUrls(concatUrls, db, mobile === true || mobile === 'true')

  return [...map]
}
