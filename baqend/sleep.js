/**
 * Sleeps for a given time of milliseconds.
 *
 * @param {number} time The time to sleep in milliseconds.
 * @param {T} result The result to promise.
 * @return {Promise<T>} A promise resolving with the result after the given time.
 * @template T
 */
function sleep(time, result) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), time);
  });
}

exports.sleep = sleep;
