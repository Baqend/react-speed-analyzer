import { baqend } from 'baqend'
import fetch from 'node-fetch'
import { getAdSet } from './_adBlocker'
import { Config } from './_Config'
import { ConfigBuilder } from './_ConfigBuilder'
import { getTLD } from './_getSpeedKitUrl'
import { dollarRegExp, escapeRegExp, removeDuplicates, toRegExp } from './_helpers'
import { PuppeteerResource } from './_Puppeteer'
import credentials from './credentials'

export const CDN_LOCAL_URL = 'https://makefast.app.baqend.com/v1/file/www/selfMaintainedCDNList'

type Conditions = (string | RegExp)[]

export class ConfigGenerator {
  constructor(
    private readonly logger: Logger,
  ) {
  }

  /**
   * Returns the default Speed Kit config for the given URL.
   */
  generateMinimal(url: string, mobile: boolean = false): Config {
    // Generate reg exp for URL's TLD
    const tld = getTLD(url, this.logger)
    const domainRegExp = new RegExp(`^[A-Za-z.-]*${escapeRegExp(tld)}$`)

    return {
      appName: credentials.app,
      whitelist: [{ host: domainRegExp }],
      userAgentDetection: mobile,
    }
  }

  /**
   * Returns the fallback config for a URL.
   */
  generateFallback(url: string, mobile: boolean = false): Config {
    return this.generateBasic(
      url,
      mobile,
      [/cdn/, /(?:^|\.)assets\./, /(?:^|\.)static\./, /(?:^|\.)images\./, 's3.amazonaws.com', 'ajax.googleapis.com'],
      [/\.min\.(?:css|js)$/],
      ['https://apis.google.com/js/plusone.js'],
    )
  }

  /**
   * Analyzes the given domains and creates a Speed Kit config with a suggested whitelist.
   */
  async generateSmart(url: string, mobile: boolean, thirdParty: boolean, { host, domains, resources }: { host: string, domains: string[], resources: PuppeteerResource[] }): Promise<Config> {
    const configBuilder = new ConfigBuilder(credentials.app, mobile)

    // Add host to whitelist
    const hostMatcher = this.matchAllSubdomains(host)
    configBuilder
      .whitelistHost(hostMatcher)

    // Get hosts to whitelist by CDN without ads
    const cdnDomainsWithAds = await this.selectCdnDomains(domains)
    const cdnDomainsWithoutAds = await this.filterOutAdDomains(cdnDomainsWithAds)
    cdnDomainsWithoutAds
      .filter(host => thirdParty || host.match(hostMatcher))
      .map(toRegExp)
      .map(dollarRegExp)
      .forEach(host => configBuilder.whitelistHost(host))

    // Whitelist .min.js and .min.css URLs without cookies
    resources
      .filter(resource => !resource.cookies.length)
      .filter(resource => resource.url.match(/\.min\.(?:css|js)$/))
      .filter(resource => thirdParty || resource.host.match(hostMatcher))
      .map(resource => this.stripResourceUrl(resource))
      .forEach(url => configBuilder.whitelistUrl(url))

    // Whitelist https://apis.google.com/js/plusone.js if it is used
    resources
      .filter(resource => thirdParty && resource.url === 'https://apis.google.com/js/plusone.js')
      .map(resource => this.stripResourceUrl(resource))
      .forEach(url => configBuilder.whitelistUrl(url))

    // Blacklist jQuery callback URLs
    resources
      .filter(resource => this.isJQueryCallback(resource))
      .filter(resource => thirdParty || resource.host.match(hostMatcher))
      .map(resource => this.stripResourceUrl(resource))
      .filter(removeDuplicates)
      .forEach(url => configBuilder.blacklistUrl(url))

    return configBuilder.build()
  }

  /**
   * Generates a basic config.
   */
  private generateBasic(
    url: string,
    mobile: boolean = false,
    hosts: Conditions = [],
    pathnames: Conditions = [],
    urls: Conditions = [],
  ): Config {
    // Build minimal config
    const minimal = this.generateMinimal(url, mobile)

    if (hosts.length) {
      minimal.whitelist!.push({ host: hosts })
    }

    if (pathnames.length) {
      minimal.whitelist!.push({ pathname: pathnames })
    }

    if (urls.length) {
      minimal.whitelist!.push({ url: urls })
    }

    return minimal
  }

  /**
   * Selects only all CDN domains.
   */
  private async selectCdnDomains(domains: string[]): Promise<string[]> {
    const regExps = await this.getCdnRegExps()

    return domains.filter(domain => regExps.some(regExp => regExp.test(domain)))
  }

  /**
   * Gets an array of regular expressions which match CDN domains.
   */
  private async getCdnRegExps(): Promise<RegExp[]> {
    const response = await fetch(CDN_LOCAL_URL)
    const text = await response.text()

    return text.trim()
      .split(/\s*(?:\r\n|[\r\n])\s*/)
      .map(toRegExp)
      .concat([/(?:\.|^)images\./, /(?:\.|^)static\./])
  }

  /**
   * Filters out all advertisement domains.
   */
  private async filterOutAdDomains(domains: string[]): Promise<string[]> {
    const ads = await getAdSet()
    const regExps = [...ads].filter(it => !!it.length).map(toRegExp)

    return domains.filter(domain => !regExps.some(regExp => regExp.test(domain)))
  }

  /**
   * Strip resource URL.
   */
  private stripResourceUrl(resource: PuppeteerResource) {
    return resource.url
      .replace(/^https?:\/\//, '')
      .replace(/\?[^?]*$/, '')
  }

  /**
   * Matches all subdomains of the given domain.
   */
  private matchAllSubdomains(domain: string): RegExp {
    const match = /[\w-]+\.[\w-]+$/.test(domain) ? RegExp.lastMatch : domain
    return dollarRegExp(toRegExp(match))
  }

  /**
   * Determines whether a resource is a jQuery callback.
   */
  private isJQueryCallback(resource: PuppeteerResource): boolean {
    return !!resource.url.match(/\?callback=jQuery/)
  }
}
