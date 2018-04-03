import credentials from './credentials';
import fetch from 'node-fetch';
import URL from 'url';

const CDN_LOCAL_URL = 'https://makefast.app.baqend.com/v1/file/www/selfMaintainedCDNList';

/**
 * Extracts the first level domain of a URL.
 *
 * @param db The Baqend instance.
 * @param {string} url The URL to extract the hostname of.
 * @return {string} The extracted hostname.
 */
export function getTLD(db, url: string) {
  try {
    const { hostname } = URL.parse(url);
    const domainFilter = /^(?:[\w-]*\.){0,3}([\w-]*\.)[\w]*$/;
    const [, domain] = domainFilter.exec(hostname);

    return domain
  } catch (e) {
    db.log.warn(`Get TLD for url ${url} failed.`);
    return '';
  }
}

/**
 * Extracts the root path of a given full path.
 *
 * @param db The Baqend instance.
 * @param fullPath The path to extract the root path from.
 * @return {string} The extracted root path.
 */
export function getRootPath(db, fullPath: string) {
  try {
    const { protocol, hostname } = URL.parse(fullPath);
    return protocol + '//' + hostname;
  } catch (e) {
    db.log.warn(`Get root path for url ${fullPath} failed.`);
    return '';
  }
}

/**
 * Escapes a regular expression.
 *
 * @param {string} str
 * @return {string}
 */
function escapeRegExp(str: string): string {
  return str.replace(/[[\]/{}()*+?.\\^$|-]/g, '\\$&');
}

export function getDefaultConfig(db, url: string): string {
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
function generateRules(db, originalUrl: string, whitelist: string[]): string {
  const domain = getTLD(db, originalUrl);

  // Create parts for the regexp
  return `/^(?:[\\w-]*\\.){0,3}(?:${[domain, ...whitelist].map(item => escapeRegExp(item)).join('|')})/`;
}

function generateCDNRegex(): Promise<string> {
  return fetch(CDN_LOCAL_URL)
    .then(resp => resp.text())
    .then((text) => {
      const lines = text.trim().split('\n');
      return `/${lines.map(line => line.replace(/\./g, '\\.')).join('|')}/`;
    });
}

/**
 * Returns the URL to send to Speed Kit.
 *
 * @param db The Baqend instance.
 * @param {string} originalUrl The URL to make fast. ;-)
 * @param {string} whitelistStr The whitelist string with comma-separated values.
 * @param {boolean} enableUserAgentDetection Enables the user agent detection in makefast
 * @return {string} A URL to send to Speed Kit.
 */
export function generateSpeedKitConfig(db, originalUrl, whitelistStr, enableUserAgentDetection): Promise<string> {
  const whitelistDomains = (whitelistStr || '')
    .split(',')
    .map(item => item.trim())
    .filter(item => !!item);

  const whitelist = generateRules(db, originalUrl, whitelistDomains);
  return generateCDNRegex().then(cdnRegex => `{
    appName: "${credentials.app}",
    whitelist: [{ host: [ ${whitelist}, ${cdnRegex}] }],
    userAgentDetection: ${enableUserAgentDetection},
    }`);
}
