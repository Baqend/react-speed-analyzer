import { Condition, Config, ImageRule, ResourceRule, Rule, StripParamsRule } from './_Config'
import { PuppeteerResource } from './_Puppeteer'

export const CONFIG_MAX_SIZE: number = 50

export class ConfigBuilder {

  private appName: string
  private userAgentDetection: boolean
  private whitelist: Rule[] = []
  private blacklist: Rule[] = []
  private image: ImageRule[] = []
  private criticalResources: ResourceRule[] = []
  private stripQueryParams: StripParamsRule[] = []

  /**
   * The current size of the config counting all included conditions.
   */
  private _size: number = 0
  private _maxCapacity: number

  constructor(appName: string, userAgentDetection: boolean, maxCapacity: number = CONFIG_MAX_SIZE) {
    this.appName = appName
    this.userAgentDetection = userAgentDetection
    this._maxCapacity = maxCapacity
  }

  build(): Config {
    const config: Config = { appName: this.appName, userAgentDetection: this.userAgentDetection }
    if (this.whitelist.length) {
      config.whitelist = this.whitelist
    }

    if (this.blacklist.length) {
      config.blacklist = this.blacklist
    }

    if (this.image.length) {
      config.image = this.image
    }

    if (this.criticalResources.length) {
      config.criticalResources = this.criticalResources
    }

    if (this.stripQueryParams.length) {
      config.stripQueryParams = this.stripQueryParams
    }

    return config
  }

  /**
   * Returns the size of the config counting all included conditions.
   */
  get size(): number {
    return this._size
  }

  get isCapacityReached(): boolean {
    return this.size >= this._maxCapacity;
  }

  whitelistHost(host: Condition): this {
    return this.addToWhitelist('host', host)
  }

  whitelistPathname(host: Condition): this {
    return this.addToWhitelist('pathname', host)
  }

  whitelistUrl(host: Condition): this {
    return this.addToWhitelist('url', host)
  }

  blacklistUrl(host: Condition): this {
    return this.addToBlacklist('url', host)
  }

  blacklistPathname(pathname: Condition): this {
    return this.addToBlacklist('pathname', pathname)
  }

  blacklistContentType(contentType: Condition): this {
    return this.addToBlacklist('contentType', contentType)
  }

  addImageOptions(imageRule: ImageRule) {
    this.image.push(imageRule)
  }

  addCriticalResource(resourceRule: ResourceRule) {
    this.criticalResources.push(resourceRule);
  }

  addStripQueryParams(stripQueryParamsRule: StripParamsRule) {
    this.stripQueryParams.push(stripQueryParamsRule);
  }

  public matchOnWhitelist(puppeteerResource: PuppeteerResource): boolean {
    return this.whitelist.some((rule) => {
      //Remove protocol from URL
      const strippedUrl = puppeteerResource.url.replace(/(^\w+:|^)\/\//, '');
      // rule could be url, host or pathName
      const isUrlOnWhitelist = rule.url ? this.testCondition(strippedUrl, rule.url) : true
      const isHostOnWhitelist = rule.host ? this.testCondition(puppeteerResource.host, rule.host) : true
      const isPathnameOnWhitelist = rule.pathname ? this.testCondition(puppeteerResource.pathname, rule.pathname) : true

      return isUrlOnWhitelist && isHostOnWhitelist && isPathnameOnWhitelist
    });
  }

  /**
   * Tests if a condition matches on a string.
   *
   * @param {string} subject The string to test.
   * @param {Condition} condition The condition to match.
   * @return {boolean} True, if the condition matches.
   */
  private testCondition(subject: string, condition: Condition): boolean {
    if (condition instanceof Array) {
      return condition.some(cond => this.testCondition(subject, cond));
    }

    if (condition instanceof RegExp) {
      return condition.test(subject);
    }

    return subject.startsWith(condition);
  }

  private addToWhitelist(section: 'host' | 'pathname' | 'url', value: Condition): this {
    if (this.isCapacityReached) {
      return this
    }
    this._size += 1

    for (const rule of this.whitelist) {
      const condition: Condition | undefined = rule[section]
      // Add to existing entry
      if (condition) {
        if (condition instanceof Array) {
          if (value instanceof Array) {
            condition.concat(value)
          } else {
            condition.push(value)
          }
        } else {
          if (value instanceof Array) {
            rule[section] = [condition].concat(value)
          } else {
            rule[section] = [condition, value]
          }
        }

        return this
      }
    }

    // Add new entry
    this.whitelist.push({ [section]: value })
    return this
  }

  private addToBlacklist(section: 'host' | 'pathname' | 'url' | 'contentType', value: Condition): this {
    if (this.isCapacityReached) {
      return this
    }
    this._size += 1

    for (const rule of this.blacklist) {
      const condition: Condition | undefined = rule[section]
      // Add to existing entry
      if (condition) {
        if (condition instanceof Array) {
          if (value instanceof Array) {
            condition.concat(value)
          } else {
            condition.push(value)
          }
        } else {
          if (value instanceof Array) {
            rule[section] = [condition].concat(value)
          } else {
            rule[section] = [condition, value]
          }
        }

        return this
      }
    }

    // Add new entry
    this.blacklist.push({ [section]: value })
    return this
  }
}
