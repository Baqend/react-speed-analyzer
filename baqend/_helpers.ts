import { EntityManager, baqend, binding, model, query } from 'baqend'
import { concat, filter, map, mapValues, mergeWith, pick, reduce } from 'lodash'
// @ts-ignore
import {Blob} from 'buffer'
import { Pagetest } from './_Pagetest'
import { isFinished, isUnfinished, setCanceled } from './_Status'
import { toFile } from './_toFile'
import credentials from './credentials'

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
export function cleanObject<T extends { [key: string]: any }>(obj: T): T {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      delete obj[key]
    }
  }

  return obj
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

/**
 * Truncates a url string to a maximum of 700 characters and returns a new string.
 */
export async function truncateUrl(url: string): Promise<string> {
  const blob = new Blob([url])
  if (blob.size < 1024) {
    return url
  }

  const lastParamIndex = url.lastIndexOf('&') !== -1 ? url.lastIndexOf('&') : url.lastIndexOf('?')
  if (lastParamIndex === -1) {
    return blob.slice(0, 1023).text()
  }

  return truncateUrl(url.substr(0, lastParamIndex))
}

/**
 * Creates the filmstrip screenshot.
 *
 * @param db The Baqend instance.
 * @param wptTestIds A lis of webPageTest ids to be included in the filmstrip.
 * @param url The url where the file gets saved.
 * @param isDesktop The device type.
 * @return A promise resolving with the file created or null.
 */
export async function createFilmStrip(
  db:baqend,
  wptTestIds: string[],
  url: string,
  isDesktop: boolean
): Promise<binding.File | null> {
  try {
    const device = isDesktop ? 'desktop' : 'mobile'
    const tests = wptTestIds.map(id => `${id}-l:%20`).join(',')
    const screenshotLink = `${credentials.wpt_dns}/video/filmstrip.php?tests=${tests}`;
    return await toFile(db, screenshotLink, `/www/screenshots/${urlToFilename(url)}/${device}/${generateHash()}.jpg`)
  } catch {
    return null;
  }
}

/**
 * Cancels the given test.
 */
export async function cancelTest(test: model.TestResult, api: Pagetest): Promise<boolean> {
  if (isFinished(test)) {
    return false
  }

  const unfinishedTests = !!test.webPagetests ? test.webPagetests
    .filter(webPagetest => isUnfinished(webPagetest)) : []

  // Mark test and WebPagetests as canceled
  await test.optimisticSave(() => {
    setCanceled(test)
    if (unfinishedTests.length) {
      unfinishedTests.forEach(webPagetest => setCanceled(webPagetest))
    }
  })

  if (unfinishedTests.length) {
    // Cancel each WebpageTest
    await unfinishedTests
      .map(webPagetest => api.cancelTest(webPagetest.testId))
      .reduce(parallelize, Promise.resolve())
  }

  return true
}

export function getVariation(mobile: boolean, location: string): string {
  const isUS = location.startsWith('us')
  if (mobile) {
    return isUS ? 'SCRAPING_MOBILE_US' : 'SCRAPING_MOBILE'
  }

  return isUS ? 'SCRAPING_US' : 'SCRAPING'
}

/**
 * Iterates over a query to fetch all results using the specified builder, accumulating them into an array.
 *
 * @template T The type of the entities being queried.
 * @param {EntityManager} db - The database entity manager.
 * @param {query.Builder<any>} builder - The query builder used to fetch results.
 * @param {T[]} [acc=[]] - The accumulator array to store the fetched results.
 * @param {string} [id=''] - The last fetched id to continue fetching results from.
 * @returns {Promise<T[]>} - A promise that resolves to an array of all fetched results.
 */
export async function iterateQuery<T>(db: EntityManager, builder: query.Builder<any>, acc: any[] = [], id = ''): Promise<T[]> {
  const result = await builder
    .gt('id', id)
    .ascending('id')
    .resultList();

  // Check iteration done
  if (!result.length) {
    return acc;
  }

  // eslint-disable-next-line no-param-reassign
  acc = acc.concat(result);
  db.clear();
  return iterateQuery(db, builder, acc, result[result.length - 1].id);
}

/**
 * Extracts the origin from a given URL.
 *
 * @param {string} url - The URL to extract the origin from.
 * @returns {string} - The extracted origin.
 */
export function extractOrigin(url: string): string {
  try {
    const { origin } = new URL(url);
    return origin;
  } catch {
    return url;
  }
}

/**
 * Strips the protocol and 'www.' from a given origin.
 *
 * @param {string} origin - The origin to process.
 * @returns {string} - The processed origin.
 */
export function processOrigin(origin: string): string {
  return origin.replace(/(^\w+:|^)\/\//, '').replace(/^www\./, '');
}
