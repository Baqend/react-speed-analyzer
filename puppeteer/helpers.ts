/**
 * Merges maps of the same type.
 */
export function mergeMaps<K, V>(target: Map<K, V>, ...maps: Array<Map<K, V>>): Map<K, V> {
  for (const map of maps) {
    map.forEach((value, key) => target.set(key, value))
  }
  return target
}

/**
 * Converts an object to a map.
 */
export function objectToMap<V>(source: { [key: string]: V }): Map<string, V> {
  return new Map<string, V>(Object.entries(source))
}

/**
 * Lower-cases the first letter of a string.
 */
export function lcFirst(string: string): string {
  if (!string) {
    return string
  }

  return `${string[0].toLowerCase()}${string.substr(1)}`
}

/**
 * Converts "kebab-cased-string" to a "camelCasedString".
 */
export function kebabToCamelCase(string: string): string {
  return string.replace(/-(.)/g, (str, arg: string) => arg.toUpperCase())
}

/**
 * Calculates the difference between arbitrary values.
 */
export function difference(first: number | undefined, second: number | undefined, factor = 1): number {
  if (typeof first !== 'number' || typeof second !== 'number') {
    return -1
  }

  if (first === -1 || second === -1) {
    return -1
  }

  return roundToThousandths((first - second) * factor)
}

/**
 * Ensures a value is numerical.
 */
export function optionalNumber(number: number | undefined) {
  if (typeof number !== 'number' || number === -1) {
    return -1
  }

  return roundToThousandths(number)
}

/**
 * Rounds a number to thousands (the third fractional digit).
 */
export function roundToThousandths(number: number): number {
  return Math.round(number * 1000) / 1000
}

/**
 * Returns a pair with the tail and the foot of an array.
 */
export function tailFoot<T>(array: T[]): [T[], T] {
  const it = array.pop()
  return [array, it]
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
 * Extracts all domains of some resources
 */
export function getDomainsOfResources(resources: Iterable<Resource>): Set<string> {
  const domains = new Set<string>()
  for (const { host } of resources) {
    domains.add(host)
  }

  return domains
}

/**
 * Filters out all ServiceWorker registrations whose scope does not match a given URL.
 */
export function filterServiceWorkerRegistrationsByUrl(map: ServiceWorkerRegistrationMap, url: string) {
  for (const [registrationId, registration] of map) {
    if (!url.startsWith(registration.scopeURL)) {
      map.delete(registrationId)
    }
  }
}
