import { toUnicode } from 'punycode'
import { format, parse } from 'url'

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
