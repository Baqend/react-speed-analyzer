const API = require('./Pagetest');

exports.call = function(db, data, req) {
  const { baqendId } = data;
  return getTestStatus(db, baqendId);
};

/**
 * @param db
 * @param {string} baqendId The test result ID.
 * @return {Promise<{status: number}>}
 */
function getTestStatus(db, baqendId) {
  return db.TestResult.load(baqendId)
    .then((result) => {
      if (!result) {
          throw new Abort('Object not found');
      }
      if (result.testId) {
        return API.getTestStatus(result.testId);
      } else if (result.webPagetests && result.webPagetests.length){
        return API.getTestStatus(result.webPagetests[0].testId)
      }
    })
    .then(status => ({ status }));
}

exports.getTestStatus = getTestStatus;
