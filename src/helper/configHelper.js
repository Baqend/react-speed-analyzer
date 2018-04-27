/**
 * Extracts the top level domain of a URL.
 *
 * @param {string} url The URL to extract the hostname of.
 * @return {string} The extracted hostname.
 */
export function getTLD(url) {
  try {
    if(url.indexOf('http') === -1 && url.indexOf('https') === -1) {
      url = `http://${url}`
    }

    const dummyElement = document.createElement('a')
    dummyElement.href = url

    const { hostname } = dummyElement

    const domainCount = hostname.split('.').length - 1
    if (domainCount === 1) {
      return hostname
    }

    return /.*\.([\w-]+\.[\w]*)$/.exec(hostname)[1]
  } catch(e) {
    return ''
  }
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
  return `/.*(${[domain, ...whitelist].map(item => escapeRegExp(item)).join('|')})/`
}

/**
 * Returns the URL to send to Speed Kit.
 *
 * @param {string} originalUrl The URL to make fast.
 * @param {boolean} enableUserAgentDetection Enables the user agent detection in makefast.
 * @return {string} A URL to send to Speed Kit.
 */
export function generateDefaultConfig(originalUrl, enableUserAgentDetection) {
  const whitelist = generateRules(originalUrl, '')

  return `{
    appName: 'makefast',
    whitelist: [{ host: [ ${whitelist} ] }],
    userAgentDetection: ${enableUserAgentDetection},
  }`
}
