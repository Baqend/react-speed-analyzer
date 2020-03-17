import { baqend } from 'baqend'
import fetch from 'node-fetch'
import { getAdSet } from './_adBlocker'
import { Config } from './_Config'
import { ConfigBuilder } from './_ConfigBuilder'
import { getTLD } from './_getSpeedKitUrl'
import { dollarRegExp, escapeRegExp, removeDuplicates, toRegExp } from './_helpers'
import { PuppeteerResource, ResourceType } from './_Puppeteer'
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
   * Analyzes the given domains and creates a Speed Kit config with a suggested white- and blacklist.
   *
   * @param {string} url The site to test.
   * @param {boolean} mobile true if it is a mobile test, false otherwise.
   * @param {boolean} thirdParty true if third party domains should be added to the config, false otherwise.
   * @param {boolean} imageOptimization true if images should be optimized, false otherwise.
   * @param {boolean} preload true if css and fonts should be preloaded, false otherwise.
   * @param {string} app The name of the Baqend app to connect to.
   * @param {string} host The host of the tested site.
   * @param {string[]} domains The domains loaded by the tested site.
   * @param {PuppeteerResource[]} resources The resources loaded by the tested site.
   * @return {Promise<Config>} A smart config for Speed Kit.
   */
  async generateSmart(
    url: string,
    mobile: boolean,
    thirdParty: boolean,
    imageOptimization: boolean,
    preload: boolean,
    app: string,
    { host, domains, resources }: { host: string, domains: string[], resources: PuppeteerResource[] }): Promise<Config>
  {
    const configBuilder = new ConfigBuilder(app, mobile)

    // Add image optimization
    if (imageOptimization) {
      // TODO implement actual IO
      configBuilder.addImageOptions({ rules: [{ url: [''] }], options: { quality: 1, webp: true} });
    }
    // Add host to whitelist
    const hostMatcher = this.matchAllSubdomains(host)
    configBuilder.whitelistHost(hostMatcher)

    // Blacklist jQuery callback URLs
    resources
      .filter(resource => this.isJQueryCallback(resource))
      .filter(resource => thirdParty || resource.host.match(hostMatcher))
      .map(resource => this.stripResourceUrl(resource))
      .filter(removeDuplicates)
      .forEach(url => configBuilder.blacklistUrl(url))

    // Blacklist jQuery callback pathnames
    if (this.containsJQuery(resources)) {
      configBuilder.blacklistUrl(/[?&](_=1\d{12})/)
    }

    // Blacklist PDF files on default
    configBuilder.blacklistUrl(/\.pdf/)

    // Blacklist video files
    configBuilder.blacklistContentType(['video']);

    // Add default params to be stripped
    configBuilder.addStripQueryParams({
      params: [
        'utm_',
        'msclkid',
        'gclsrc',
        'fbclid',
        'dclid',
        'cjid',
        'gclid',
      ]
    })

    if (thirdParty) {
      // Add hosts to whitelist if only the top level domain differs from tested url
      // (e.g. add 'baqend.org' if host is 'baqend.com')
      const topLevelDomainMatcher = this.matchOtherTopLevelDomains(host);
      domains
        .filter(domain => domain.match(topLevelDomainMatcher))
        .filter(domain => !domain.match(hostMatcher))
        .filter(removeDuplicates)
        .forEach(domain => configBuilder.whitelistHost(domain))

      // Get hosts to whitelist by CDN without ads
      const cdnDomainsWithAds = await this.selectCdnDomains(domains)
      const cdnDomainsWithoutAds = await this.filterOutAdDomains(cdnDomainsWithAds)
      cdnDomainsWithoutAds
        .filter(host => !host.match(hostMatcher)) // filter already whitelisted domains
        .forEach(host => configBuilder.whitelistHost(host))

      // Whitelist .min.js and .min.css URLs without cookies
      resources
        .filter(resource => !resource.cookies.length)
        .filter(resource => resource.url.match(/\.min\.(?:css|js)$/))
        .filter(resource => !resource.host.match(hostMatcher)) // filter already whitelisted urls
        .map(resource => this.stripResourceUrl(resource))
        .forEach(url => configBuilder.whitelistUrl(url))

      // Whitelist cacheable Google requests.
      resources
        .filter(resource => this.isCacheableGoogleRequest(resource))
        .filter(resource => !resource.host.match(hostMatcher)) // filter already whitelisted urls
        .map(resource => this.stripResourceUrl(resource))
        .forEach(url => configBuilder.whitelistUrl(url))

      // Whitelist https://apis.google.com/js/plusone.js if it is used
      resources
        .filter(resource => thirdParty && resource.url === 'https://apis.google.com/js/plusone.js')
        .map(resource => this.stripResourceUrl(resource))
        .forEach(url => configBuilder.whitelistUrl(url))
    }

    if (preload) {
      let cssSeen = false
      let otherSeen = false
      const criticalResources: string[] = [];
      resources.forEach(resource => {
        // Always add fonts to critical resources
        if (resource.type === ResourceType.FONT) {
          configBuilder.matchOnWhitelist(resource) && criticalResources.push(resource.url)
          otherSeen = cssSeen;
          return;
        }

        // Only add stylesheet after the first css request was made and other requests were made afterwards
        if (resource.type === ResourceType.STYLESHEET) {
          if (otherSeen) {
            configBuilder.matchOnWhitelist(resource) && criticalResources.push(resource.url)
          }

          cssSeen = true;
          return;
        }

        otherSeen = cssSeen;
      })

      criticalResources.length && configBuilder.addCriticalResource({ resources: criticalResources });
    }

    return configBuilder.build();
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
   * Returns a regex that matches all subdomains of the given domain as well as other top level domains.
   * @param {string} domain The domain to match.
   * @return {RegExp} The regex that matches all subdomains of the given domain as well as other top level domains.
   */
  private matchOtherTopLevelDomains(domain: string): RegExp {
    if (/([\w-]+\.)[\w-]+$/.test(domain)) {
      return new RegExp(`${escapeRegExp(RegExp.$1)}[\\w-]+$`)
    }

    return dollarRegExp(toRegExp(domain))
  }

  /**
   * Determines whether a resource is a cachable Google request e.g. Google Analytics.
   */
  private isCacheableGoogleRequest(resource: PuppeteerResource) {
    return resource.url.match(/^(?:http(s)?:\/\/)?www\.google-analytics\.com\/analytics\.js/)
      || resource.url.match(/^(?:http(s)?:\/\/)?www\.googletagmanager\.com\/gtm\.js/)
      || resource.url.match(/^(?:http(s)?:\/\/)?www\.googletagservices\.com\/tag\/js\/gpt\.js/)
  }

  /**
   * Determines whether a resource is a jQuery callback.
   */
  private isJQueryCallback(resource: PuppeteerResource): boolean {
    return !!resource.url.match(/[?&]callback=/) || !!resource.url.match(/[?&]jsonp_callback =/)
  }

  /**
   * Determines if the given resources contain jQuery.
   */
  private containsJQuery(resources: PuppeteerResource[]): boolean {
    return resources.find((resource) => {
      const { pathname } = resource

      return pathname.match(/jquery(-[\d.]+)?(\.min)?\.js/) != null
    }) != null
  }
}
