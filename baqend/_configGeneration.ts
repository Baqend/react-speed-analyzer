import fetch from 'node-fetch'
import { baqend } from 'baqend'
import { getAdSet } from './_adBlocker'
import { getTLD } from './_getSpeedKitUrl'
import credentials from './credentials'
import { escapeRegExp, toRegExp } from './_helpers'
import { WptTestResult } from './_Pagetest'

const CDN_LOCAL_URL = 'https://makefast.app.baqend.com/v1/file/www/selfMaintainedCDNList';

/**
 * Returns the default Speed Kit config for the given url.
 */
export function getMinimalConfig(db: baqend, url: string, mobile: boolean) {
  const tld = getTLD(db, url);
  const domainRegex = `/^(?:[\\w-]*\\.){0,3}(?:${escapeRegExp(tld)})/`;

  return `{
    appName: "${credentials.app}",
    whitelist: [{ host: [ ${domainRegex} ] }],
    userAgentDetection: ${mobile}
  }`;
}

export function getCacheWarmingConfig(mobile: boolean) {
  return `{
    appName: "${credentials.app}",
    userAgentDetection: ${mobile}
  }`;
}

/**
 * Returns the fallback config for a URL.
 */
export function getFallbackConfig(db: baqend, url: string, mobile: boolean = false): string {
  const tld = getTLD(db, url);
  const domainRegex = `/^(?:[\\w-]*\\.){0,3}(?:${escapeRegExp(tld)})/`;

  return `{
    appName: "${credentials.app}",
    whitelist: [{ host: [ ${domainRegex}, /cdn/, /assets\./, /static\./ ] }],
    userAgentDetection: ${mobile}
  }`;
}

/**
 * Analyzes the given domains and creates a Speed Kit config with a suggested whitelist.
 *
 * @param db The Baqend instance.
 * @param url The tested URL.
 * @param testResult The result data of the prewarm run with Speed Kit.
 * @param mobile Whether the test was performed against mobile.
 * @param whitelist Whitelisted domains as string.
 * @return
 */
export async function createSmartConfig(
  db: baqend,
  url: string,
  testResult: WptTestResult,
  mobile: boolean = false,
  whitelist: string = ''
): Promise<string> {
  const domains = getDomains(testResult, db)
  db.log.info(`Analyzing domains: ${url}`, { domains })

  const cdnDomainsWithAds = await selectCdnDomains(domains)
  db.log.info(`CDN domains`, { cdnDomainsWithAds })

  const cdnDomainsWithoutAds = await filterOutAdDomains(cdnDomainsWithAds)
  db.log.info(`Domains without ads`, { cdnDomainsWithoutAds })

  const cdnRegexps = cdnDomainsWithoutAds.map(toRegExp).join(', ')
  const whitelistedHosts = whitelist ? `${cdnRegexps}, ${whitelist}` : cdnRegexps

  const tld = getTLD(db, url)
  const domainRegex = `/^(?:[\\w-]*\\.){0,3}(?:${escapeRegExp(tld)})/`

  return `{
    appName: "${credentials.app}",
    whitelist: [{ host: [ ${domainRegex}, ${whitelistedHosts} ] }],
    userAgentDetection: ${mobile}
  }`
}

/**
 * Gets an array of regular expressions which match CDN domains.
 */
export async function getCdnRegExps(): Promise<RegExp[]> {
  const response = await fetch(CDN_LOCAL_URL)
  const text = await response.text()

  return text.trim().split(/\s*(?:\r\n|[\r\n])\s*/).map(toRegExp)
}

/**
 * Selects only all CDN domains.
 */
async function selectCdnDomains(domains: string[]): Promise<string[]> {
  const regExps = await getCdnRegExps()

  return domains.filter(domain => regExps.some(regExp => regExp.test(domain)))
}

/**
 * Filters out all advertisement domains.
 */
async function filterOutAdDomains(domains: string[]): Promise<string[]> {
  const ads = await getAdSet()
  const regExps = [...ads].filter(it => !!it.length).map(toRegExp)

  return domains.filter(domain => !regExps.some(regExp => regExp.test(domain)))
}

function getDomains(testResult: WptTestResult, db: baqend): string[] {
  if (!testResult || !testResult.runs || !testResult.runs['1'] || !testResult.runs['1'].firstView || !testResult.runs['1'].firstView.domains) {
    throw new Error(`No testdata to analyze domains ${testResult.url}`)
  }

  const domains = Object.keys(testResult.runs['1'].firstView.domains)
  if (domains.length < 1) {
    db.log.warn(`Analyzed domains empty.`, { testResult })
    throw new Error(`No testdata to analyze domains ${testResult.url}`)
  }

  if (domains.length === 1) {
    db.log.warn(`Analyzed domains limited.`, { testResult })
    throw new Error(`Only one domain to analyse ${testResult.url}`)
  }

  return domains
}
