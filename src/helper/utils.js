/* global window */

/**
 * @param {number} bytes The file size in bytes to format.
 * @param {number} [decimals] The number of decimals.
 * @return {string}
 */
export const formatFileSize = (bytes, decimals) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1000
  const dm = decimals || 2
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / (k ** i)).toFixed(dm))} ${sizes[i]}`
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
  const pattern =
    new RegExp('((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?' + // port
      '(\\/[-a-z\\d%@_.~+&:#]*)*' + // path
      '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return pattern.test(str)
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
