const { countBy } = require('lodash');

/**
 * @param {Request[]} requests
 * @return {Object<string, number>}
 */
function countHits(requests) {
  let size = 0;
  let withCaching = 0;

  const count = countBy(requests, (req) => {
    const headers = req.headers;
    if (headers) {
      const resHeaders = headers.response.join(' ').toLowerCase();
      if (resHeaders.indexOf('cache-control:') !== -1 &&
        (resHeaders.indexOf('etag:') !== -1) || resHeaders.indexOf('last-modified:') !== -1) {
        withCaching += 1;
      }

      if (resHeaders.indexOf('via: baqend') !== -1) {
        const contentHeader = headers.response.find(item => item.includes('content-length'));
        size += contentHeader ? parseInt(contentHeader.substring(contentHeader.indexOf(':') + 1).trim(), 10) : 0;
        return resHeaders.indexOf('x-cache: hit') !== -1 ? 'hit' : 'miss';
      }
    }
    return 'other';
  });

  count.size = size;
  count.withCaching = withCaching;
  return count;
}

exports.countHits = countHits;
