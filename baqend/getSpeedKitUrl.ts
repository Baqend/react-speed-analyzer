import URL from 'url'
import { baqend } from 'baqend'
import { escapeRegExp } from './helpers'
import { getCdnRegExps } from './configGeneration'
import credentials from './credentials'

/**
 * Extracts the first level domain of a URL.
 *
 * @param db The Baqend instance.
 * @param url The URL to extract the hostname of.
 * @return The extracted hostname.
 */
export function getTLD(db: baqend, url: string): string {
  try {
    const { hostname } = URL.parse(url)
    const domainFilter = /^(?:[\w-]*\.){0,3}([\w-]*\.)[\w]*$/
    const [, domain] = domainFilter.exec(hostname!)!

    return domain
  } catch (e) {
    db.log.warn(`Get TLD for url ${url} failed.`)
    return ''
  }
}

/**
 * Extracts the root path of a given full path.
 *
 * @param db The Baqend instance.
 * @param fullPath The path to extract the root path from.
 * @return The extracted root path.
 */
export function getRootPath(db: baqend, fullPath: string): string {
  try {
    const { protocol, hostname } = URL.parse(fullPath)
    return `${protocol}//${hostname}`
  } catch (e) {
    db.log.warn(`Get root path for url ${fullPath} failed.`)
    return ''
  }
}

export function getDefaultConfig(db: baqend, url: string): string {
  const tld = getTLD(db, url);
  const domainRegex = `/^(?:[\\w-]*\\.){0,3}(?:${escapeRegExp(tld)})/`;

  return `{
    appName: "${credentials.app}",
    whitelist: [{ host: [ ${domainRegex} ] }],
    userAgentDetection: false
  }`;
}

/**
 * Generates a reg exp representing the whitelist.
 *
 * @param db The Baqend instance.
 * @param {string} originalUrl The original URL to the site.
 * @param {string[]} whitelist An array of whitelist domains.
 * @return {string} A regexp string representing the white listed domains
 */
function generateRules(db: baqend, originalUrl: string, whitelist: string[]): string {
  const domain = getTLD(db, originalUrl);

  // Create parts for the regexp
  return `/^(?:[\\w-]*\\.){0,3}(?:${[domain, ...whitelist].map(item => escapeRegExp(item)).join('|')})/`;
}

/**
 * Generate one regular expression to match all CDN domains.
 */
async function generateCdnDomainRegExp(): Promise<string> {
  const regExps = await getCdnRegExps()

  return `/${regExps.join('|')}/`
}

/**
 * Returns the URL to send to Speed Kit.
 *
 * @param db The Baqend instance.
 * @param originalUrl The URL to make fast. ;-)
 * @param whitelistStr The whitelist string with comma-separated values.
 * @param enableUserAgentDetection Enables the user agent detection in makefast
 * @return A URL to send to Speed Kit.
 */
export async function generateSpeedKitConfig(db: baqend, originalUrl: string, whitelistStr: string, enableUserAgentDetection: boolean): Promise<string> {
  const whitelistDomains = (whitelistStr || '')
    .split(',')
    .map(item => item.trim())
    .filter(item => !!item);

  const whitelist = generateRules(db, originalUrl, whitelistDomains);
  const cdnRegExp = await generateCdnDomainRegExp()

  return `{
    appName: "${credentials.app}",
    whitelist: [{ host: [ ${whitelist}, ${cdnRegExp}] }],
    userAgentDetection: ${enableUserAgentDetection},
  }`
}
