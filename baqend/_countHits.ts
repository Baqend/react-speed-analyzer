import { countBy } from 'lodash'
import { WptRequest } from './_Pagetest'

export type HitCounters = { hit: number, miss: number, other: number, size: number, withCaching: number }

/**
 * @param requests An array of requests to count
 * @return The counters
 */
export function countHits(requests: WptRequest[]): HitCounters {
  let size = 0
  let withCaching = 0

  const count = countBy(requests, ({ headers }) => {
    if (headers) {
      const resHeaders = headers.response.join(' ').toLowerCase()
      if (resHeaders.indexOf('cache-control:') !== -1 &&
        (resHeaders.indexOf('etag:') !== -1) || resHeaders.indexOf('last-modified:') !== -1) {
        withCaching += 1;
      }

      if (resHeaders.indexOf('via: baqend') !== -1) {
        // Determine content size
        const contentHeader = headers.response.find(item => item.includes('content-length'))
        size += contentHeader ? parseInt(contentHeader.substring(contentHeader.indexOf(':') + 1).trim(), 10) : 0

        return resHeaders.indexOf('x-cache: hit') !== -1 ? 'hit' : 'miss'
      }
    }

    return 'other'
  }) as HitCounters

  count.size = size
  count.withCaching = withCaching
  return count
}
