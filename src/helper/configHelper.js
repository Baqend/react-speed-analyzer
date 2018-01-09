/**
 * Extracts the top level domain of a URL.
 *
 * @param {string} url The URL to extract the hostname of.
 * @return {string} The extracted hostname.
 */
export function getTLD(url) {
  const dummyElement = document.createElement('a')
  dummyElement.href = url

  let { hostname } = dummyElement
  // Remove "www" in the beginning
  if (hostname.indexOf('www.') !== -1) {
    hostname = hostname.substr(hostname.indexOf('www.') + 4)
  }

  const domainFilter = /^(?:[\w-]*\.){0,3}([\w-]*\.)[\w]*$/
  const [, domain] = domainFilter.exec(hostname)

  // remove the dot at the end of the string
  return domain
}

/**
 * Escapes a regular expression.
 *
 * @param {string} str
 * @return {string}
 */
export function escapeRegExp(str) {
  return str.replace(/[[\]/{}()*+?.\\^$|-]/g, '\\$&')
}

/**
 * Generates a reg exp representing the whitelist.
 *
 * @param {string} originalUrl The original URL to the site.
 * @param {string[]} whitelist An array of whitelist domains.
 * @return {string} A regexp string representing the white listed domains.
 */
export function generateRules(originalUrl, whitelist) {
  const domain = getTLD(originalUrl)

  // Create parts for the regexp
  return `/^(?:[\\w-]*\\.){0,3}(?:${[domain, ...whitelist].map(item => escapeRegExp(item)).join('|')})/`
}

/**
 * Returns the URL to send to Speed Kit.
 *
 * @param {string} originalUrl The URL to make fast.
 * @param {string} whitelistStr The whitelist string with comma-separated values.
 * @param {boolean} enableUserAgentDetection Enables the user agent detection in makefast.
 * @return {string} A URL to send to Speed Kit.
 */
export function generateSpeedKitConfig(originalUrl, whitelistStr, enableUserAgentDetection) {
  const whitelistDomains = whitelistStr
    .split(',')
    .map(item => item.trim())
    .filter(item => !!item)

  const whitelist = generateRules(originalUrl, whitelistDomains)

  return `{
    appName: "makefast",
    whitelist: [{ host: [ ${whitelist} ] }],
    userAgentDetection: ${enableUserAgentDetection},
  }`
}
