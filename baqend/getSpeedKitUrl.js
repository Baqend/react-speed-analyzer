const credentials = require('./credentials');
const fetch = require('node-fetch');
const URL = require('url');

const CDN_LOCAL_URL = 'https://makefast.app.baqend.com/v1/file/www/assets/selfMaintainedCDNList';
/**
 * Extracts the first level domain of a URL.
 *
 * @param {string} url The URL to extract the hostname of.
 * @return {string} The extracted hostname.
 */
function getTLD(url) {
  const { hostname } = URL.parse(url);

  const domainFilter = /^(?:[\w-]*\.){0,3}([\w-]*\.)[\w]*$/;
  const [, domain] = domainFilter.exec(hostname);

  // remove the dot at the end of the string
  return domain;
}

/**
 * Escapes a regular expression.
 *
 * @param {string} str
 * @return {string}
 */
function escapeRegExp(str) {
  return str.replace(/[[\]/{}()*+?.\\^$|-]/g, '\\$&');
}

function getDefaultConfig(url) {
  const tld = getTLD(url);
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
 * @param {string} originalUrl The original URL to the site.
 * @param {string[]} whitelist An array of whitelist domains.
 * @return {string} A regexp string representing the white listed domains
 */
function generateRules(originalUrl, whitelist) {
  const domain = getTLD(originalUrl);

  // Create parts for the regexp
  return `/^(?:[\\w-]*\\.){0,3}(?:${[domain, ...whitelist].map(item => escapeRegExp(item)).join('|')})/`;
}

function generateCDNRegex() {
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
 * @param {string} originalUrl The URL to make fast. ;-)
 * @param {string} whitelistStr The whitelist string with comma-separated values.
 * @param {boolean} enableUserAgentDetection Enables the user agent detection in makefast
 * @return {string} A URL to send to Speed Kit.
 */
function generateSpeedKitConfig(originalUrl, whitelistStr, enableUserAgentDetection) {
  const whitelistDomains = (whitelistStr || '')
    .split(',')
    .map(item => item.trim())
    .filter(item => !!item);

  const whitelist = generateRules(originalUrl, whitelistDomains);
  return generateCDNRegex().then(cdnRegex => `{
    appName: "${credentials.app}",
    whitelist: [{ host: [ ${whitelist}, ${cdnRegex}] }],
    userAgentDetection: ${enableUserAgentDetection},
    }`);
}

exports.generateSpeedKitConfig = generateSpeedKitConfig;
exports.getTLD = getTLD;
exports.getDefaultConfig = getDefaultConfig;
