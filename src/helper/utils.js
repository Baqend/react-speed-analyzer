/* global window fbq ga */
import punycode from 'punycode'

const DOMAIN_PATTERN =  /^(www\.)?[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]{2,}(:[0-9]{1,5})?$/i

/**
 * @param {number} bytes The file size in bytes to format.
 * @param {number} [decimals] The number of decimals.
 * @return {string}
 */
export const formatFileSize = (bytes, decimals) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1000
  const dm = decimals || 0
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / (k ** i)).toFixed(dm))} ${sizes[i]}`
}

export const trackURL = (name, url, { fmp, startTime } = {}) => {
  if (fmp) {
    fmp *= 100
    fmp = Math.round(fmp)
  }

  let waitingTime
  if (startTime) {
    waitingTime = Math.round((new Date().getTime() - startTime.getTime()) / 1000)
  }

  if (typeof fbq !== 'undefined') {
    fbq('trackCustom', name, { url, fmp, waitingTime })
  }

  if (typeof ga !== 'undefined') {
    ga('send', 'event', 'speed-analyzer', name, url, fmp || waitingTime)
  }
}


/**
 * @param {object} objectId The id of the corresponding object
 * @return {string}
 */
export const getObjectKey = (objectId) => {
  if (objectId) {
    const objectSplit = objectId.split('/')
    return objectSplit[objectSplit.length - 1]
  }
  return null
}

/**
 * Check if a given string is a valid url.
 * @param {string} str The string to be checked.
 * @return {boolean}
 */
export const isURL = (str) => {
  // Check is not a relative URL
  if (str.match(/^\//)) {
    return false
  }

  // Check and strip protocol
  const protocolMatch = splitString(str, '://')
  if (protocolMatch) {
    const [protocol, rest] = protocolMatch
    if (protocol !== 'http' && protocol !== 'https') {
      return false
    }

    str = rest
  }

  const pathMatch = splitString(str, '/')
  const domain = punycode.toASCII(pathMatch ? pathMatch[0] : str)

  return DOMAIN_PATTERN.test(domain)
}

/**
 * Split a string at a given split character.
 * @param {string} str The string to split.
 * @param {string} splitChr The character to split at.
 * @returns {null|[string, string]} The split parts or null, if not found.
 */
export const splitString = (str, splitChr) => {
  const index = str.indexOf(splitChr)
  if (index >= 0) {
    return [str.substring(0, index), str.substring(index + splitChr.length)]
  }

  return null
}

export const shuffle = (a) => {
  let counter = a.length
  while (counter > 0) {
    let index = Math.floor(Math.random() * counter)
    counter--
    let temp = a[counter]
    a[counter] = a[index]
    a[index] = temp
  }
  return a
}

/**
 * Verify whether the browser is IE or not.
 * @return {boolean}
 */
export const isIE = () =>
  /MSIE 10/i.test(navigator.userAgent) ||
  /MSIE 9/i.test(navigator.userAgent) ||
  /rv:11.0/i.test(navigator.userAgent)

/**
 * Verify whether the browser is Edge or not.
 * @return boolean
 */
export const isEdge = ()  => window.navigator.userAgent.indexOf('Edge') > -1

/**
 * Verify whether the device is IOS or not.
 * @return {boolean}
 */
export const isDeviceIOS = () => window.navigator.userAgent.match(/iPhone|iPod/i)
