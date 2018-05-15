import { baqend, model } from 'baqend'
import fetch from 'node-fetch'
import { getAdSet } from './_adBlocker'
import { Config } from './_Config'
import { getTLD } from './_getSpeedKitUrl'
import { dollarRegExp, escapeRegExp, toRegExp } from './_helpers'
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
  async generateSmart(url: string, mobile: boolean, { domains }: { domains: string[] }): Promise<Config> {
    this.logger.info(`Analyzing domains: ${url}`, { domains })

    const cdnDomainsWithAds = await this.selectCdnDomains(domains)
    this.logger.info(`CDN domains`, { cdnDomainsWithAds })

    const cdnDomainsWithoutAds = await this.filterOutAdDomains(cdnDomainsWithAds)
    this.logger.info(`Domains without ads`, { cdnDomainsWithoutAds })

    const whitelistedHosts = cdnDomainsWithoutAds
      .map(toRegExp)
      .map(dollarRegExp)

    return this.generateBasic(url, mobile, whitelistedHosts)
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

    return text.trim().split(/\s*(?:\r\n|[\r\n])\s*/).map(toRegExp)
  }

  /**
   * Filters out all advertisement domains.
   */
  private async filterOutAdDomains(domains: string[]): Promise<string[]> {
    const ads = await getAdSet()
    const regExps = [...ads].filter(it => !!it.length).map(toRegExp)

    return domains.filter(domain => !regExps.some(regExp => regExp.test(domain)))
  }
}
