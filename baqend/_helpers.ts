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
  return filter(numbers, number => Number.isFinite(number))
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

  return (mergeWith as any)(...objects, (a: any, b: any) => concat(a, b))
}


/**
 * Aggregates an array of runs.
 *
 * @param runs
 * @param fields
 * @return A mean containing the aggregated values.
 */
export function aggregateFields<U>(runs: U[], fields: Array<keyof U>) {
  const means = map(runs, run => pick(run, fields)) as Array<{ [key: string]: any }>
  return mapValues(mergeConcat(means), values => meanValue(finites(values)))
}

/**
 * Escapes a regular expression.
 *
 * @param str The string to escape.
 * @return The escaped string.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[[\]/{}()*+?.\\^$|-]/g, '\\$&')
}

/**
 * Turns a string into a matchable regular expression.
 */
export function toRegExp(str: string): RegExp {
  return new RegExp(escapeRegExp(str))
}

/**
 * Adds a dollar to the end of a regular expression.
 */
export function dollarRegExp(regExp: RegExp): RegExp {
  return new RegExp(`${regExp.source}$`, regExp.flags)
}

/**
 * Cleans all entries of an object which contain an empty value.
 */
export function cleanObject<T extends { [key: string]: any }>(obj: T): Required<T> {
  const result: Required<T> = Object.create(null)
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key] = value
    }
  }

  return result
}

/**
 * Assigns fields of the source to the target.
 */
export function assignObject<S>(target: S, source: S, ...keys: Array<keyof S>) {
  for (const key of keys) {
    target[key] = source[key]
  }
}

/**
 * Appends an element to a possible empty array.
 */
export function appendItem<T>(array: T[] | null | undefined, item: T): T[] {
  if (array instanceof Array) {
    array.push(item)
    return array
  }

  return [item]
}

/**
 * Generate a hash with 6 chars.
 */
export function generateHash(): string {
  const chars = 'ABCDEFGHIJKLMOPQRSTUVWXYZabcdefghijklmopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }

  return result
}

/**
 * Makes a string URL-compatible.
 */
export function urlify(string: string): string {
  string = string.toLocaleLowerCase()

  return string.replace(/[^a-z]+/g, '-')
}

/**
 * Creates a filename from a given URL.
 */
export function urlToFilename(url: string): string {
  const prefix = url
    .replace(/^https?:\/\//, '')

  return urlify(prefix)
    .replace(/^\W+/, '')
    .replace(/\W+$/, '')
}

/**
 * Generates a date string.
 */
export function getDateString(): string {
  const date = new Date().toISOString()
  return date.substr(0, 10) + '-' + date.substr(11, 8).replace(/:/g, '')
}

/**
 * Removes duplicates from an array. Put this callback into the `Array.prototype.filter` method.
 */
export function removeDuplicates<T>(value: T, index: number, array: T[]): boolean {
  return array.indexOf(value) === index
}

/**
 * Parallelizes the given promise array.
 */
export function parallelize<T>(previous: Promise<T>, current: Promise<T>, currentIndex: number, array: Promise<T>[]): Promise<T> {
  return Promise.all([previous, current]).then(([p]) => p)
}

/**
 * Picks some fields of the given type.
 */
export function take<T, K extends keyof T>(obj: T, ...fields: K[]): Pick<T, K> {
  const result = Object.create(null)
  for (const field of fields) {
    result[field] = obj[field]
  }

  return result
}

/**
 * Maps a dictionary with a callback function.
 */
export function mapObj<U, V>(dic: { [key: string]: U }, cb: (u: U) => V): { [key: string]: V } {
  const result = Object.create(null) as { [key: string]: V }
  for (let i in dic) {
    if (Object.prototype.hasOwnProperty.call(dic, i)) {
      result[i] = cb(dic[i])
    }
  }

  return result
}

/**
 * Extracts the boolean value of the given input value.
 */
export function booleanOf(value: string | boolean): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  throw new Error(`Invalid boolean value: "${value}".`)
}
