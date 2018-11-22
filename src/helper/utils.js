/* global window fbq ga */

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
 * @param str The string to be checked.
 * @return {boolean}
 */
export const isURL = (str) => {
  const encodedString = encodeUmlauts(str)
  const pattern = new RegExp('[-a-zA-Z0-9@:%._+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_+.~#?&/=]*)', 'i')
  return pattern.test(encodedString)
}

/**
 * Encodes all umlauts contained in a given string.
 * @param str The string to be encoded.
 * @return {string}
 */
export const encodeUmlauts = (str) => {
  const encodedStr = str.toLowerCase()
  return encodedStr
    .replace(/ä/g, encodeURIComponent('ä'))
    .replace(/ö/g, encodeURIComponent('ö'))
    .replace(/ü/g, encodeURIComponent('ü'))
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
 * Verify whether the site was loaded in an IFrame or not.
 * @return {boolean}
 */
export const isIFrame = () => {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
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
