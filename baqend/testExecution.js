const { API } = require('./Pagetest');
const { generateTestResult } = require('./resultGeneration');

/**
 * Executes the given test and returns the result.
 * @param testScript The test script to execute.
 * @param pendingTest The test data object that is update along the way
 * @param db The Baqend instance.
 * @return The generated test result.
 */
function executeTest(testScript, pendingTest, { testOptions }, db) {
  return API.runTestWithoutWait(testScript, testOptions)
    .then(testId => waitForStartedTest(testId, testScript, pendingTest, db))
    .then(testId => saveTestResult(testId, pendingTest, testScript, db))
    .catch(error => handleTestError(pendingTest, testScript, error, db));
}

function waitForStartedTest(testId, testScript, pendingTest, db) {
  db.log.info(`Test started: ${testId}`, { testScript });
  pendingTest.testId = testId;
  pendingTest.ready().then(() => pendingTest.save());
  return API.waitOnTest(testId, db);
}

function saveTestResult(testId, pendingTest, testScript, db) {
  db.log.info(`Test successful: ${testId}`, { testResult: pendingTest.id, testId: pendingTest.testId, testScript});
  return generateTestResult(testId, pendingTest, db)
    .then(() => pendingTest.ready().then(() => pendingTest.save()));
}

/**
 * Handles the failure of the pending test.
 *
 * @param pendingTest The test which failed.
 * @param {string|null} testScript The script which was executed.
 * @param {Error} error The error that was thrown.
 * @param db The Baqend instance.
 */
function handleTestError(test, testScript, error, db) {
  db.log.error(`Test failed: ${test.testId}`, { testResult: test.id, testId: test.testId, testScript, error: error.stack });
  return test.ready()
    .then(() => {
      // Save that test has finished without data
      test.testDataMissing = true;
      test.hasFinished = true;
      return test.save();
    });
}

exports.executeTest = executeTest;
exports.handleTestError = handleTestError;
