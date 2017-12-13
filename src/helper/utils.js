/* global window */

/**
 * @param {number} bytes The file size in bytes to format.
 * @param {number} [decimals] The number of decimals
 * @return {string}
 */
export function formatFileSize(bytes, decimals) {
  if (bytes === 0) return '0 Bytes'
  const k = 1000
  const dm = decimals || 2
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / (k ** i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Lets the VM sleep for a given time.
 *
 * @param {number} millis The time to sleep in milliseconds.
 * @return {Promise<void>} A promise which resolves when we wake up.
 */
export function sleep(millis) {
  return new Promise((resolve) => {
    setTimeout(resolve, millis)
  })
}

/**
 * Verify whether the device is IOS or not
 */
export function isDeviceIOS() {
  return window.navigator.userAgent.match(/iPhone|iPod/i)
}

/**
 * Sort an Array of Objects by a given sort criterion
 *
 * @param {Array} dataArray An Array of Objects.
 * @param {string} sortCriterion Criterion for sort mechanism
 * @return {Array} The sorted Array of objects
 */
export function sortArray(dataArray, sortCriterion) {
  return dataArray[sortCriterion].sort((a, b) => parseFloat(b.requests) - parseFloat(a.requests))
}

/**
 * @param {string} name
 * @return {null|string}
 */
export function getParameterByName(name) {
  const url = window.location.href
  const newName = name.replace(/[[\]]/g, '\\$&')
  const regex = new RegExp(`[?&]${newName}(=([^&#]*)|&|#|$)`)
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

/**
 * @param {object} object The object to get the key attribute from
 * @return {string}
 */
export function getObjectKey(object) {
  const objectSplit = object.id.split('/')
  return objectSplit[objectSplit.length - 1]
}
