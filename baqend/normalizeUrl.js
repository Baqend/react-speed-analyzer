const { analyzeUrls } = require('./analyzeUrl');

exports.call = (db, { urls, mobile }) => analyzeUrls([].concat(urls), db, mobile === true || mobile === 'true')
  .then(results => [...results].filter(([, result]) => !!result).map(([query, result]) => ({
    query,
    url: result.url,
    displayUrl: result.displayUrl,
    isBaqendApp: result.type === 'baqend',
    isSecured: result.secured,
    swUrl: result.swUrl,
    speedkit: result.enabled,
    speedkitVersion: result.speedKitVersion,
    type: result.type,
  })));
