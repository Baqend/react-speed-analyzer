import { concat, filter, map, mapValues, mergeWith, pick, reduce } from 'lodash'

/**
 * @param {number[]} numbers
 * @return {number}
 */
export function meanValue(numbers: number[]): number {
  return reduce(numbers, (mean, n) => mean + (n / numbers.length), 0)
}

/**
 * @param {T[]} numbers
 * @return {number[]}
 * @type T
 */
export function finites(numbers: any[]): number[] {
  return filter(numbers, Number.isFinite)
}

/**
 * @param {Array<Object<T>>} objects
 * @return {Object<Array<T>>}
 * @type T
 */
export function mergeConcat<T>(objects: Array<{ [key: string]: T }>): { [key: string]: T[] } {
  if (objects.length === 1) {
    return mapValues(objects[0], a => [a])
  }

  return (mergeWith as any)(...objects, (a, b) => concat(a, b))
}


/**
 * Aggregates an array of runs.
 *
 * @param runs
 * @param fields
 * @return A mean containing the aggregated values.
 */
export function aggregateFields(runs, fields) {
  const means = map(runs, run => pick(run, fields))
  return mapValues(mergeConcat(means), values => meanValue(finites(values)))
}
