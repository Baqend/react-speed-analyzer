/**
 * Sleeps for a given time of milliseconds.
 *
 * @param {number} time The time to sleep in milliseconds.
 * @param {T} result The result to promise.
 * @return {Promise<T>} A promise resolving with the result after the given time.
 * @template T
 */
export function sleep<T>(time: number, result?: T): Promise<T | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), time)
  })
}

