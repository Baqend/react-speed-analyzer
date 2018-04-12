import { baqend } from 'baqend'
import fetch, { Response } from 'node-fetch'
import { toUnicode } from 'punycode'
import { format, parse } from 'url'
import { BasicUrlInfo, OptUrlInfo, SpeedKitInfo, UrlInfo } from './_UrlInfo'

const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_0_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13A452 Safari/601.1 PTST/396'

export class UrlAnalyzer {
  constructor(private readonly db: baqend) {
  }

  /**
   * Analyzes a bunch of URLs.
   * The result is given in a Map returning a result for each query sent.
   *
   * @param urls The URLs to test.
   * @param mobile Whether to fetch the mobile variant of the site.
   * @return A promise which resolves with the analysis's result map.
   * @template Result
   */
  async analyzeUrls(urls: string[], mobile: boolean = false): Promise<Map<string, OptUrlInfo>> {
    const promises = urls.map(query => this.forMap(query, this.analyzeUrl(query, mobile)))
    const map = await Promise.all(promises)

    return new Map(map)
  }

  /**
   * Analyzes a single result.
   *
   * @param url The URL to test.
   * @param mobile Whether to fetch the mobile variant of the site.
   * @return A promise which resolves with the analysis's result.
   * @template Result
   */
  analyzeUrl(url: string, mobile: boolean = false): Promise<OptUrlInfo> {
    const urlsToTest = this.addSchema(url)
    const fetchPromises = urlsToTest.map(someUrl => this.fetchUrl(someUrl, mobile))

    // Race for the best result
    return this.raceBestResult(fetchPromises).then(result => {
      if (!result) {
        this.db.log.error(`NormalizeUrl failed.`, { url, mobile, result })
      }
      return result
    })
  }

  /**
   * Analyzes the website's type.
   *
   * @param {Response} response
   */
  private async analyzeType(response: Response): Promise<string | null> {
    const via = response.headers.get('via')
    if (via === 'baqend' || response.url.includes('www.baqend.com')) {
      return Promise.resolve('baqend')
    }

    const xGenerator = response.headers.get('x-generator')
    if (xGenerator && xGenerator.toLocaleLowerCase().includes('sulu')) {
      return Promise.resolve('sulu')
    }

    if (response.headers.has('x-wix-request-id') || response.headers.has('x-wix-route-id')) {
      return Promise.resolve('wix')
    }

    if (response.headers.has('x-host') && response.headers.get('x-host')!.includes('weebly.net')) {
      return Promise.resolve('weebly')
    }

    if (response.headers.has('x-jimdo-instance')) {
      return Promise.resolve('jimdo')
    }

    const text = await response.text()
    const result = /<meta\s+name=["']generator["']\s*content=["']([^"']+)["']/i.exec(text)
    if (result) {
      const [, generator] = result
      const s = generator.toLocaleLowerCase()
      if (s.includes('joomla')) {
        return 'joomla'
      }
      if (s.includes('wordpress')) {
        return 'wordpress'
      }
      if (s.includes('drupal')) {
        return 'drupal'
      }
      if (s.includes('typo3')) {
        return 'typo3'
      }
    }

    if (text.includes('<!-- This is Squarespace. -->')) {
      return 'squarespace'
    }

    return null
  }

  /**
   * @param speedKitUrl The Service Worker URL to look for Speed Kit.
   * @return An info object.
   */
  private async fetchServiceWorkerUrl(speedKitUrl: string): Promise<SpeedKitInfo> {
    const error = { speedKitEnabled: false, speedKitVersion: null, speedKitUrl: null }
    try {
      const res = await fetch(speedKitUrl)
      if (!res.ok) {
        return error
      }

      const text = await res.text()
      const matches = /\/\* ! speed-kit ([\d.]+) \|/.exec(text)
      if (matches) {
        const [, speedKitVersion] = matches
        return { speedKitEnabled: true, speedKitVersion, speedKitUrl }
      }

      return error
    } catch (e) {
      return error
    }
  }

  /**
   * @param url The URL to test for Speed Kit.
   * @param isWordPress Whether this is a WordPress instance.
   * @return A Speed Kit info object.
   */
  private async testForSpeedKit(url: string, isWordPress: boolean): Promise<SpeedKitInfo> {
    const parsedUrl = parse(url)
    const paths = isWordPress ? parsedUrl.path!.split('/').filter(path => path) : []
    paths.unshift(parsedUrl.host!)

    const promises = paths.map((path, index) => {
      const subPath = paths.slice(0, index + 1).join('/')
      const swUrl = parsedUrl.protocol + '//' + subPath + '/sw.js'

      return this.fetchServiceWorkerUrl(swUrl)
    })

    const speedKitData = await Promise.all(promises)
    const enabledUrls = speedKitData.filter(speedKit => speedKit.speedKitEnabled)
    if (enabledUrls.length > 0) {
      this.db.log.info(`Speed Kit found on URL ${enabledUrls[0].speedKitUrl} with version ${enabledUrls[0].speedKitVersion}`)
      return enabledUrls[0]
    }

    this.db.log.info(`No Speed Kit found for URL ${url}`)

    return { speedKitEnabled: false, speedKitVersion: null, speedKitUrl: null }
  }

  /**
   * Converts a punycode URL to a UTF-8 URL.
   */
  private urlToUnicode(url: string): string {
    const { hostname, protocol, search, query, port, pathname } = parse(url)
    const obj = { hostname: toUnicode(hostname!), pathname: decodeURIComponent(pathname || ''), protocol, search, query, port }

    return format(obj)
  }

  /**
   * @param url The URL to fetch.
   * @param mobile Whether to fetch the mobile variant of the site.
   * @param redirectsPerformed The count of redirects performed so far.
   * @param isRetry
   * @return The optional result
   */
  private async fetchUrl(url: string, mobile: boolean, redirectsPerformed: number = 0, isRetry: boolean = false): Promise<UrlInfo | null> {
    this.db.log.info(`Analyzing ${url}`, { mobile, redirectsPerformed, url })
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

        this.db.log.info(`Found redirect from ${url} to ${location}`, { mobile, redirectsPerformed, url })
        return this.fetchUrl(location, mobile, redirectsPerformed + 1)
      }

      // Retrieve properties of that domain
      const secured = url.startsWith('https://')
      const displayUrl = this.urlToUnicode(url)
      const type = await this.analyzeType(response)
      const resultInfo: BasicUrlInfo = { url, mobile, displayUrl, type, secured }
      const speedKit = await this.testForSpeedKit(url, type === 'wordpress')

      return { ...resultInfo, ...speedKit }
    } catch (error) {
      const hasWWW = url.indexOf('www') !== -1
      if (!hasWWW && !isRetry) {
        this.db.log.info(`Start fetching retry with www for url ${url} in analyzeURL.`)
        const editUrl = url.replace('://', '://www.')
        return this.fetchUrl(editUrl, mobile, redirectsPerformed, true)
      }

      this.db.log.warn(`Error while fetching ${url} in analyzeURL: ${error.stack}`)
      return null
    }
  }

  /**
   * @param query The URL to add a schema to.
   * @return An array of URLs with schema.
   */
  private addSchema(query: string): string[] {
    if (/^https?:\/\//.test(query)) {
      return [query]
    }

    return [`https://${query}`, `http://${query}`]
  }

  /**
   * @param {Array<Promise<null|T>>} resultPromises The results to race.
   * @return {Promise<null|T>} The best raced result.
   * @type T The result type.
   */
  private raceBestResult(resultPromises: Array<Promise<OptUrlInfo>>): Promise<OptUrlInfo> {
    return new Promise((resolveOuter) => {
      const promises = resultPromises.map(p => p.then((result) => {
        if (result && result.secured) {
          resolveOuter(result)
          return null
        }

        return result
      }))

      // Fallback to best matching result
      Promise.all(promises).then(results => results.reduce((p, r) => p || r, null)).then(resolveOuter)
    })
  }

  /**
   * Wraps a promise to be used in a map.
   */
  private forMap<K, V>(key: K, deferredValue: Promise<V>): Promise<[K, V]> {
    return deferredValue.then(value => [key, value] as [K, V])
  }
}
