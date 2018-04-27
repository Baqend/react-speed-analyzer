import { baqend, model } from 'baqend'
import fetch from 'node-fetch'
import { getAdSet } from './_adBlocker'
import { Config } from './_Config'
import { getTLD } from './_getSpeedKitUrl'
import { escapeRegExp, toRegExp } from './_helpers'
import { WptTestResult } from './_Pagetest'
import credentials from './credentials'

export const CDN_LOCAL_URL = 'https://makefast.app.baqend.com/v1/file/www/selfMaintainedCDNList'

export class ConfigGenerator {
  constructor(
    private readonly db: baqend,
  ) {
  }

  /**
   * Returns the default Speed Kit config for the given URL.
   */
  generateMinimal(url: string, mobile: boolean = false): Config {
    const tld = getTLD(this.db, url)
    const domainRegex = new RegExp(`.*${escapeRegExp(tld)}`)

    return {
      appName: credentials.app,
      whitelist: [{ host: domainRegex }],
      userAgentDetection: mobile,
    }
  }

  /**
   * Returns the fallback config for a URL.
   */
  generateFallback(url: string, mobile: boolean = false): Config {
    const tld = getTLD(this.db, url)
    const domainRegex = new RegExp(`.*${escapeRegExp(tld)}`)

    return {
      appName: credentials.app,
      whitelist: [{ host: [domainRegex, /cdn/, /assets\./, /static\./] }],
      userAgentDetection: mobile,
    }
  }

  /**
   * Analyzes the given domains and creates a Speed Kit config with a suggested whitelist.
   */
  async generateSmart(url: string, domains: string[], mobile: boolean = false): Promise<Config> {
    this.db.log.info(`Analyzing domains: ${url}`, { domains })

    const cdnDomainsWithAds = await this.selectCdnDomains(domains)
    this.db.log.info(`CDN domains`, { cdnDomainsWithAds })

    const cdnDomainsWithoutAds = await this.filterOutAdDomains(cdnDomainsWithAds)
    this.db.log.info(`Domains without ads`, { cdnDomainsWithoutAds })

    const whitelistedHosts = cdnDomainsWithoutAds.map(toRegExp)

    const tld = getTLD(this.db, url)
    const domainRegex = new RegExp(`.*${escapeRegExp(tld)}`)

    return {
      appName: credentials.app,
      whitelist: [{ host: [domainRegex, ...whitelistedHosts] }],
      userAgentDetection: mobile,
    }
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
