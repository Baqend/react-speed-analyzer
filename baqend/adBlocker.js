const fetch = require('node-fetch');

const AD_SERVER_URL = 'https://raw.githubusercontent.com/easylist/easylist/master/easylist/easylist_adservers.txt';
const AD_LOCAL_URL = 'https://makefast.app.baqend.com/v1/file/www/assets/selfMaintainedAdList';

let adHosts;

/**
 * @return {Promise<Set<string>>} A set of ad domain strings
 */
function loadAdSet() {
  return fetch(AD_SERVER_URL)
    .then(resp => resp.text())
    .then((text) => {
      const lines = text.split('\n')
        .filter(line => line.startsWith('||'))
        .map(line => line.substring(2, line.indexOf('^$')));

      return new Set(lines);
    });
}

/**
 * @return {Promise<Set<string>>} A set of ad domain strings
 */
function addLocalAdList(adSet) {
  return fetch(AD_LOCAL_URL)
    .then(resp => resp.text())
    .then((text) => {
      const lines = text.split('\n');
      lines.forEach(line => adSet.add(line));
      return adSet;
    });
}

/**
 * Returns all domains that are ads.
 *
 * @returns {Promise<Set<string>>} A set of ad domain strings
 */
function getAdSet() {
  if (adHosts) {
    return Promise.resolve(adHosts);
  }

  return loadAdSet().then((adSet) => {
    const completedSet = addLocalAdList(adSet);
    adHosts = completedSet;
    return completedSet;
  });
}

exports.getAdSet = getAdSet;
