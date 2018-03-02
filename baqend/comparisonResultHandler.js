/**
 * Handles the result of a given WPT test id.
 *
 * @param db The Baqend instance.
 * @param {string} testId The id of the WPT test to be handled.
 */
function resultHandler(db, testId) {
  db.TestResult.find().eq('testId', testId).singleResult((testResult) => {

  });
}

exports.resultHandler = resultHandler;
