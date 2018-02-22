const fetch = require('node-fetch');
const URL = require('url');
const credentials = require('./credentials');

const ORIGIN = credentials.makefast_ip;

function analyzeSpeedKit(urlToTest, db) {
  const url = {
    protocol: 'http',
    host: ORIGIN,
    pathname: '/config',
    search: `url=${encodeURIComponent(urlToTest)}`,
  };

  const urlString = URL.format(url);
  db.log.info(`Analyzing Speed Kit Website via ${urlString}`);

  const start = Date.now();
  return fetch(urlString, { timeout: 30000 })
    .then((res) => {
      if (res.status === 404) {
        throw new Error(`Not a valid Speed Kit URL: ${urlString}`);
      }

      return res.json().then(info => {
        if (!info.config) {
          db.log.error(`No Speed Kit config found. URL: ${urlString}`);
        }
        return info;
      });
    }).catch(err => {
      throw new Error(`Fetching config from Speed Kit website failed, request time: ${Date.now() - start}ms. Error: ${err.stack}`);
    });
}

exports.analyzeSpeedKit = analyzeSpeedKit;
