import URL from 'url'
import { baqend } from 'baqend'

/**
 * Extracts the first level domain of a URL.
 *
 * @param db The Baqend instance.
 * @param url The URL to extract the hostname of.
 * @return The extracted hostname.
 */
export function getTLD(db: baqend, url: string): string {
  try {
    const { hostname } = URL.parse(url)
    const domainFilter = /^(?:[\w-]*\.){0,3}([\w-]*\.)[\w]*$/
    const [, domain] = domainFilter.exec(hostname!)!

    return domain
  } catch (e) {
    db.log.warn(`Get TLD for url ${url} failed.`)
    return ''
  }
}

/**
 * Extracts the root path of a given full path.
 *
 * @param db The Baqend instance.
 * @param fullPath The path to extract the root path from.
 * @return The extracted root path.
 */
export function getRootPath(db: baqend, fullPath: string): string {
  try {
    const { protocol, hostname } = URL.parse(fullPath)
    return `${protocol}//${hostname}`
  } catch (e) {
    db.log.warn(`Get root path for url ${fullPath} failed.`)
    return ''
  }
}
