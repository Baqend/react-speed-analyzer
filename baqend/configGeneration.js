const credentials = require('./credentials');
const fetch = require('node-fetch');
const URL = require('url');
const { getAdSet } = require('./adBlocker');

const CDN_LOCAL_URL = 'https://makefast.app.baqend.com/v1/file/www/assets/selfMaintainedCDNList';

/**
 * Returns the default Speed Kit config for the given url.
 */
function getMinimalConfig(url, mobile) {
  const tld = getTLD(url);
  const domainRegex = `/^(?:[\\w-]*\\.){0,3}(?:${escapeForRegex(tld)})/`;

  return `{
    appName: "${credentials.app}",
    whitelist: [{ host: [ ${domainRegex} ] }],
    userAgentDetection: ${mobile}
  }`;
}

function getCacheWarmingConfig(mobile) {
  return `{
    appName: "${credentials.app}",
    userAgentDetection: ${mobile}
  }`;
}

function getFallbackConfig(url, mobile) {
  const tld = getTLD(url);
  const domainRegex = `/^(?:[\\w-]*\\.){0,3}(?:${escapeForRegex(tld)})/`;

  return `{
    appName: "${credentials.app}",
    whitelist: [{ host: [ ${domainRegex}, /cdn/, /assets\./, /static\./ ] }],
    userAgentDetection: ${mobile}
  }`;
}

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
 * Analyzes the given domains and creates a Speed Kit config with a suggested whitelist.
 *
 * @param testResult The result data of the prewarm run with Speed Kit
 * @param whitelist Whitelisted domains as string.
 * @return
 */
function createSmartConfig(url, testResult, mobile, db, whitelist = '') {
  const domains = getDomains(testResult, db);

  db.log.info(`Analyzing domains: ${url}`, {domains});
  return filterCDNs(domains, db)
    .then((cdnsWithAds) => {
      db.log.info(`CDN domains`, {cdnsWithAds});
      return filterAds(cdnsWithAds, db);
    })
    .then((cdnsWithoutAds) => {
      db.log.info(`Domains without ads`, {cdnsWithoutAds});
      return cdnsWithoutAds.map(toRegex).join(', ');
    })
    .then((cdnRegexs) => {
      const whitelistedHosts = whitelist.length? `${cdnRegexs}, ${whitelist}` : cdnRegexs;

      const tld = getTLD(url);
      const domainRegex = `/^(?:[\\w-]*\\.){0,3}(?:${escapeForRegex(tld)})/`;

      return `{
        appName: "${credentials.app}",
        whitelist: [{ host: [ ${domainRegex}, ${whitelistedHosts} ] }],
        userAgentDetection: ${mobile}
      }`;
    });
}

function filterCDNs(domains, db) {
  return fetch(CDN_LOCAL_URL)
    .then(resp => resp.text())
    .then((text) => {
      return text.trim().split('\n').map(toRegex)
    })
    .then((regExs) => {
      return domains.filter((domain) => regExs.some((regEx) => regEx.test(domain)))
    });
}

function filterAds(domains, db) {
  return getAdSet()
    .then(ads => [...ads].filter(it => !!it.length).map(toRegex))
    .then((regExs) => {
      return domains.filter((domain) => !regExs.some((regEx) => regEx.test(domain)))
    });
}

function toRegex(str) {
  return new RegExp(escapeForRegex(str));
}

function escapeForRegex(str) {
  return str.replace(/[[\]/{}()*+?.\\^$|-]/g, '\\$&');
}

function getDomains(testResult, db) {
  if (!testResult || !testResult.runs || !testResult.runs['1'] || !testResult.runs['1'].firstView || !testResult.runs['1'].firstView.domains) {
    throw new Error(`No testdata to analyze domains ${testResult.url}`);
  }

  const domains = Object.keys(testResult.runs['1'].firstView.domains);
  if (!domains.length) {
    db.log.warn(`Analyzed domains empty.`, {testResult});
  }

  return domains;
}

exports.getTLD = getTLD;
exports.getMinimalConfig = getMinimalConfig;
exports.createSmartConfig = createSmartConfig;
exports.getFallbackConfig = getFallbackConfig;
exports.getCacheWarmingConfig = getCacheWarmingConfig;
