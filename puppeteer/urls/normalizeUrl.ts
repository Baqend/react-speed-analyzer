/**
 * Normalizes a URL by ensuring it starts with a correct protocol.
 */
export function normalizeUrl(url: string): string {
  if (url.startsWith('//')) {
    return `http:${decodeURIComponent(url)}`
  }

  if (!url.startsWith('http')) {
    return `http://${decodeURIComponent(url)}`
  }

  return decodeURIComponent(url)
}
