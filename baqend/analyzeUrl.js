/* global Abort */
const fetch = require('node-fetch');
const { parse, format } = require('url');
const { toUnicode } = require('punycode');

const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_0_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13A452 Safari/601.1 PTST/396';

/**
 * Analyzes the website's type.
 *
 * @param {Response} response
 */
function analyzeType(response) {
  const via = response.headers.get('via');
  if (via === 'baqend' || response.url.includes('www.baqend.com')) {
    return Promise.resolve('baqend');
  }

  const xGenerator = response.headers.get('x-generator');
  if (xGenerator && xGenerator.toLocaleLowerCase().includes('sulu')) {
    return Promise.resolve('sulu');
  }

  if (response.headers.has('x-wix-request-id') || response.headers.has('x-wix-route-id')) {
    return Promise.resolve('wix');
  }

  if (response.headers.has('x-host') && response.headers.get('x-host').includes('weebly.net')) {
    return Promise.resolve('weebly');
  }

  if (response.headers.has('x-jimdo-instance')) {
    return Promise.resolve('jimdo');
  }

  return response.text()
    .then((text) => {
      const result = /<meta\s+name=["']generator["']\s*content=["']([^"']+)["']/i.exec(text);
      if (result) {
        const [, generator] = result;
        const s = generator.toLocaleLowerCase();
        if (s.includes('joomla')) {
          return 'joomla';
        }
        if (s.includes('wordpress')) {
          return 'wordpress';
        }
        if (s.includes('drupal')) {
          return 'drupal';
        }
        if (s.includes('typo3')) {
          return 'typo3';
        }
      }

      if (text.includes('<!-- This is Squarespace. -->')) {
        return 'squarespace';
      }

      return null;
    });
}

/**
 * @param {string} url
 * @return {Promise}
 */
function testForSpeedKit(url) {
  const parsedUrl = parse(url);
  const swUrl = format(Object.assign({}, parsedUrl, { pathname: '/sw.js' }));
  const error = { enabled: false, version: null };

  return fetch(swUrl).then((res) => {
    if (!res.ok) { return error; }

    return res.text().then((text) => {
      const matches = /\/\* ! speed-kit ([\d.]+) \|/.exec(text);
      if (matches) {
        const [, version] = matches;
        return { enabled: true, version };
      }
      return error;
    });
  }).catch(() => (error));
}

/**
 * @param {string} url
 * @return {string}
 */
function urlToUnicode(url) {
  const { hostname, protocol, search, query, port, pathname } = parse(url);
  const obj = { hostname: toUnicode(hostname), protocol, search, query, port, pathname };
  return format(obj);
}

/**
 * @param {string} url
 * @param {boolean} mobile Whether to fetch the mobile variant of the site.
 * @param {number} redirectsPerformed The count of redirects performed so far.
 * @return {Promise<*>}
 */
function fetchUrl(url, mobile, db, redirectsPerformed = 0) {
  const userAgent = mobile ? MOBILE_USER_AGENT : undefined;
  return fetch(url, { redirect: 'manual', headers: { 'UserAgent': userAgent }, timeout: 12000 })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error('Status Code of Response is 400 or higher.');
      }
      const location = response.headers.get('location');

      // Redirect if location header found
      if (location) {
        if (redirectsPerformed > 20) {
          throw new Abort('The URL resolves in too many redirects.');
        }

        return fetchUrl(location, mobile, db, redirectsPerformed + 1);
      }

      // Retrieve properties of that domain
      const secured = url.startsWith('https://');
      const displayUrl = urlToUnicode(url);
      return analyzeType(response).then(type => ({ url, displayUrl, type, secured, mobile }));
    })
    .then(opts => Object.assign(opts, { supported: opts.enabled || opts.type === 'wordpress' }))
    .then(opts => testForSpeedKit(url).then(speedKit => Object.assign(opts, speedKit)))
    .catch((error) => {
     db.log.warn(`Error while fetching ${url} in analyzeURL: ${error.stack}`);
     return null;
    });
}

/**
 * @param {string} query The URL to add a schema to.
 * @return {string[]} An array of URLs with schema.
 */
function addSchema(query) {
  if (/^https?:\/\//.test(query)) {
    return [query];
  }

  return [`https://${query}`, `http://${query}`];
}

/**
 * @param {Array<Promise<null|T>>} resultPromises The results to race.
 * @return {Promise<null|T>} The best raced result.
 * @type T The result type.
 */
function raceBestResult(resultPromises) {
  return new Promise((resolveOuter) => {
    const promises = resultPromises.map(p => p.then((result) => {
      if (result && result.secured) {
        resolveOuter(result);
        return null;
      }

      return result;
    }));

    // Fallback to best matching result
    Promise.all(promises).then(results => results.reduce((p, r) => p || r, null)).then(resolveOuter);
  });
}

/**
 * Analyzes a single result.
 *
 * @param {string} query The URL to test.
 * @param {boolean} mobile Whether to fetch the mobile variant of the site.
 * @return {Promise<Result>} A promise which resolves with the analysis's result.
 * @template Result
 */
function analyzeUrl(query, db, mobile = false) {
  const urlsToTest = addSchema(query);
  const fetchPromises = urlsToTest.map(url => fetchUrl(url, mobile, db));

  // Race for the best result
  return raceBestResult(fetchPromises).then(result => {
    if (!result) {
      db.log.error(`NormalizeUrl failed.`, {query, mobile, result});
    }
    return result;
  });
}

/**
 * Analyzes a bunch of URLs.
 * The result is given in a Map returning a result for each query sent.
 *
 * @param {string[]} queries The URLs to test.
 * @param {boolean} mobile Whether to fetch the mobile variant of the site.
 * @return {Promise<Map<string, Result>>} A promise which resolves with the analysis's result map.
 * @template Result
 */
function analyzeUrls(queries, db, mobile = false) {
  return Promise.all(queries.map(query => analyzeUrl(query, db, mobile).then(result => [query, result]))).then(map => new Map(map));
}

exports.analyzeUrl = analyzeUrl;
exports.analyzeUrls = analyzeUrls;
exports.call = (db, { urls, mobile }) => analyzeUrls([].concat(urls), db, mobile === true || mobile === 'true').then(map => [...map]);
