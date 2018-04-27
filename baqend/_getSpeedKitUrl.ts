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
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }

  try {
    const { hostname } = URL.parse(url);

    const domainCount = hostname!.split('.').length - 1;

    if (domainCount === 1) {
      return hostname!;
    }

    return /.*\.([\w-]+\.[\w]*)$/.exec(hostname!)![1]

  } catch (e) {
    db.log.warn(`Get TLD for url ${url} failed.`, {error: e.stack});
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
