const {
  filter, reduce, mergeWith, concat, map, mapValues, pick,
} = require('lodash');

/**
 * @param {number[]} numbers
 * @return {number}
 */
function meanValue(numbers) {
  return reduce(numbers, (mean, n) => mean + (n / numbers.length), 0);
}

/**
 * @param {T[]} numbers
 * @return {number[]}
 * @type T
 */
function finites(numbers) {
  return filter(numbers, Number.isFinite);
}

/**
 * @param {Array<Object<T>>} objects
 * @return {Object<Array<T>>}
 * @type T
 */
function mergeConcat(objects) {
  if (objects.length === 1) {
    return mapValues(objects[0], a => [a]);
  }
  return mergeWith(...objects, (a, b) => concat(a, b));
}


/**
 * Aggregates an array of runs.
 *
 * @param runs
 * @param fields
 * @return A mean containing the aggregated values.
 */
function aggregateFields(runs, fields) {
  const means = map(runs, run => pick(run, fields));
  return mapValues(mergeConcat(means), values => meanValue(finites(values)));
}

exports.meanValue = meanValue;
exports.finites = finites;
exports.mergeConcat = mergeConcat;
exports.aggregateFields = aggregateFields;
