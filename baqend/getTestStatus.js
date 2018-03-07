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

      return API.getTestStatus(result.testId);
    })
    .then(status => ({ status }));
}

exports.getTestStatus = getTestStatus;
