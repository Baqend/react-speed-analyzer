const { API } = require('./Pagetest');

exports.call = function (db, data, req) {
  db.log.info('Pingback received for ' + data.id);

  const testId = data.id;

  API.resolveTest(db, testId);
};
