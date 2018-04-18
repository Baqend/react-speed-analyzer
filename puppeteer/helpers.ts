import { writeFile } from 'fs'
import { toUnicode } from 'punycode'
import { format, parse } from 'url'

export function mergeMaps<K, V>(target: Map<K, V>, ...maps: Array<Map<K, V>>): Map<K, V> {
  for (const map of maps) {
    map.forEach((value, key) => target.set(key, value))
  }
  return target
}

export function objectToMap<V>(source: { [key: string]: V }): Map<string, V> {
  return new Map<string, V>(Object.entries(source))
}

export function lcFirst(string: string): string {
  if (!string) {
    return string
  }

  return `${string[0].toLowerCase()}${string.substr(1)}`
}

export function kebabToCamelCase(string: string): string {
  return string.replace(/-(.)/g, (str, arg: string) => arg.toUpperCase())
}

export function difference(first: number | undefined, second: number | undefined, factor = 1): number {
  if (typeof first !== 'number' || typeof second !== 'number') {
    return -1
  }

  if (first === -1 || second === -1) {
    return -1
  }

  return roundToThousandths((first - second) * factor)
}

export function optionalNumber(number: number | undefined) {
  if (typeof number !== 'number' || number === -1) {
    return -1
  }

  return roundToThousandths(number)
}

export function roundToThousandths(number: number): number {
  return Math.round(number * 1000) / 1000
}

export function tailHead<T>(array: T[]): [T[], T] {
  const it = array.pop()
  return [array, it]
}

export function normalizeUrl(url: string): string {
  if (url.startsWith('//')) {
    return `http:${decodeURIComponent(url)}`
  }

  if (!url.startsWith('http')) {
    return `http://${decodeURIComponent(url)}`
  }

  return decodeURIComponent(url)
}

/**
 * Converts a punycode URL to a UTF-8 URL.
 */
export function urlToUnicode(url: string): string {
  const { hostname, protocol, search, query, port, pathname } = parse(url)
  const obj = {
    hostname: toUnicode(hostname!),
    pathname: decodeURIComponent(pathname || ''),
    protocol,
    search,
    query,
    port,
  }

  return format(obj)
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
 * Puts a buffer's content to a file.
 */
export function filePutContents(path: string, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    writeFile(path, data, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
