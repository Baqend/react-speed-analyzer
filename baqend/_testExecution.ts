import { baqend, model } from 'baqend'
import { API } from './_Pagetest'
import { generateTestResult } from './_resultGeneration'

/**
 * Executes the given test and returns the result.
 * @param testScript The test script to execute.
 * @param pendingTest The test data object that is update along the way
 * @param db The Baqend instance.
 * @return The generated test result.
 */
export function executeTest(testScript: string, pendingTest: model.TestResult, { testOptions }: any, db: baqend) {
  return API.runTestWithoutWait(testScript, testOptions)
    .then(testId => waitForStartedTest(testId, testScript, pendingTest, db))
    .then(testId => saveTestResult(testId, pendingTest, testScript, db))
    .catch(error => handleTestError(pendingTest, testScript, error, db))
}

function waitForStartedTest(testId: string, testScript: string, pendingTest: model.TestResult, db: baqend) {
  db.log.info(`Test started: ${testId}`, { testScript })
  pendingTest.testId = testId
  pendingTest.ready().then(() => pendingTest.save()).catch((error) => {
    db.log.warn(`Saving pendingTest failed.`, { error: error.stack, test: pendingTest.id, testId })
  })
  return API.waitOnTest(testId, db)
}

function saveTestResult(testId: string, pendingTest: model.TestResult, testScript: string, db: baqend) {
  db.log.info(`Test successful: ${testId}`, { testResult: pendingTest.id, testId: pendingTest.testId, testScript })
  return generateTestResult(testId, pendingTest, db)
    .then(() => pendingTest.ready().then(() => pendingTest.save()))
}

/**
 * Handles the failure of the pending test.
 *
 * @param test The test which failed.
 * @param {string|null} testScript The script which was executed.
 * @param {Error} error The error that was thrown.
 * @param db The Baqend instance.
 */
export function handleTestError(test: model.TestResult, testScript: string, error: Error, db: baqend) {
  db.log.error(`Test failed: ${test.testId}`, {
    testResult: test.id,
    testId: test.testId,
    testScript,
    error: error.stack,
  })
  return test.ready()
    .then(() => {
      // Save that test has finished without data
      test.testDataMissing = true
      test.status = 'FAILED'
      test.hasFinished = true
      return test.save()
    }).catch((error) => {
      db.log.error(`Could not save failed test.`, { test: test.id, error: error.stack, testScript })
      return test
    })
}
