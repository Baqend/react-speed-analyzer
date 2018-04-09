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
 * @param {Promise<T>} calculation The calculation to timeout.
 * @param {T} timeoutResult A default result to use when the calculation times out.
 * @return {Promise<T>} A promise resolving with the calculation or timeout result.
 * @template T
 */
export function timeout<T>(timeout: number, calculation: Promise<T>, timeoutResult: T): Promise<T> {
  return Promise.race([calculation, sleep(timeout, timeoutResult)])
}
