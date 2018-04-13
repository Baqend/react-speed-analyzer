/**
 * Sleeps for a given time of milliseconds.
 *
 * @param {number} time The time to sleep in milliseconds.
 * @param {T} result The result to promise.
 * @return {Promise<T>} A promise resolving with the result after the given time.
 * @template T
 */
export function sleep<T>(time: number, result?: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), time)
  })
}

/**
 * Times out a given calculation.
 *
 * @param {number} timeout The timeout given in milliseconds.
 * @param {T} resultOnTimeout A default result to use when the calculation times out.
 * @param {Promise<T>} calculation The calculation to timeout.
 * @return {Promise<T>} A promise resolving with the calculation or timeout result.
 * @template T
 */
export function timeout<T>(timeout: number, resultOnTimeout: T, calculation: () => Promise<T>): Promise<T> {
  if (typeof calculation === 'function') {
    return Promise.race([calculation(), sleep(timeout, resultOnTimeout)])
  }

  return Promise.race([calculation, sleep(timeout, resultOnTimeout)])
}
