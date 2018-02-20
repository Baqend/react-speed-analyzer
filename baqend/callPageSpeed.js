const fetch = require('node-fetch');
// eslint-disable-next-line import/no-unresolved
const credentials = require('./credentials');

const API_KEY = credentials.google_api_key;
const API_URL = 'https://www.googleapis.com/pagespeedonline/v1/runPagespeed?';

/**
 * @param {string} url The URL to run the Page Speed tests on.
 * @param {boolean} mobile Run the test as a mobile client.
 * @return {Promise<{ domains: number | null, requests: number | null, bytes: number | null, screenshot: string | null }>}
 */
function callPageSpeed(url, mobile) {
  const query = [`url=${encodeURIComponent(url)}`,
    'screenshot=true',
    `strategy=${mobile ? 'mobile' : 'desktop'}`,
    `key=${API_KEY}`,
  ].join('&');

  return fetch(API_URL + query, { method: 'get' }).then(response => Promise.all([response.ok, response.json()])).then(([ok, data]) => {
    if (!ok) {
      throw new Error(data.error.errors[0].message);
    }
    return data;
  }).then(({ pageStats, screenshot }) => {
    const domains = pageStats.numberHosts || 0;
    const requests = pageStats.numberResources || 0;

    let bytes = parseInt(pageStats.htmlResponseBytes, 10) || 0;
    bytes += parseInt(pageStats.cssResponseBytes, 10) || 0;
    bytes += parseInt(pageStats.imageResponseBytes, 10) || 0;
    bytes += parseInt(pageStats.javascriptResponseBytes, 10) || 0;
    bytes += parseInt(pageStats.otherResponseBytes, 10) || 0;

    return {
      domains, requests, bytes, screenshot,
    };
  });
}

exports.get = function get(db, req, res) {
  return callPageSpeed(req.query.url, req.query.mobile === 'true').then(results => res.send(results));
};

exports.callPageSpeed = callPageSpeed;
