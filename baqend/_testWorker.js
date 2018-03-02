const { API } = require('./Pagetest');
// const { generateTestResult } = require('./resultGeneration');

/**
 * Executes the given test and returns the result.
 * @param testScript The test script to execute.
 * @param pendingTest The test data object that is update along the way
 * @param db The Baqend instance.
 * @return The generated test result.
 */
// function executeTest(testScript, pendingTest, { testOptions }, db) {
//   return API.runTestWithoutWait(testScript, testOptions)
//     .then(testId => waitForStartedTest(testId, testScript, pendingTest, db))
//     .then(testId => saveTestResult(testId, pendingTest, testScript, db))
//     .catch(error => handleTestError(pendingTest, testScript, error, db));
// }


function resumeTest(db, testResult) {
  if (testResult.isFinished) {
    return escalateToComparisonWorker(testResult.testOverview)
  }
  if (testResult.isClone) {
    if (shouldStartPreparationTests(testResult)) {
      !testResult.speedKitConfig && startConfigGenerationWebPagetest(db, testResult)
      startPrewarmingWebPagetest(db, testResult)
    } else {
      if (hasNotFinishedWebPagetests(testResult)) {
        checkWebPagetestsStatus(testResult)
      } else {
        shouldStartPerformanceTests(testResult) && startPerformanceWebPagetest(db, testResult)
      }
    }
  } else {
    shouldStartPerformanceTests(testResult) && startPerformanceWebPagetest(db, testResult)
  }
}

function shouldStartPreparationTests(testResult) {
  if (testResult.skipPrewarm) {
    return false
  }
  return !testResult.webPageTests.length
}

function shouldStartPerformanceTests(testResult) {
  return !testResult.webPageTests.map(wpt => wpt.testType).contains('performance')
}

function hasNotFinishedWebPagetests(testResult) {
  return testResult.webPageTests.filter(wpt => !wpt.hasFinished).length > 0
}

function checkWebPagetestsStatus(testResult) {
  const checkWebPagetestStatus = () => {
    API.getTestStatus(testId).then(testId => {
      callResultHandler(testId)
    })
  }
  testResult.webPageTests.filter(wpt => !wpt.hasFinished).map(wpt => checkWebPagetestStatus(wpt.testId))
}

function startPrewarmingWebPagetest(db, testResult) {

}

function startConfigGenerationWebPagetest(db, testResult) {

}

function startPerformanceWebPagetest(db, testResult) {

}


exports.run = function(db, jobsStatus, jobsDefinition) {
  db.log.info('Running testseries job');
  return jobsDefinition.testseries.load().then(series => {
    db.log.info('Found test series, starting new bulk test');
  });
};

exports.call = function(db, data, req) {

};

exports.executeTest = executeTest;
