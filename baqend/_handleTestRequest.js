/* eslint-disable comma-dangle, no-use-before-define, no-restricted-syntax */
/* global Abort */
const { TestWorker } = require('./_testWorker');

exports.call = function(db, data, req) {
  // const testRequestHandler = new TestRequestHandler(db)
  const testWorker = new TestWorker(db)
  return testWorker.handleTestRequest(data)
};
