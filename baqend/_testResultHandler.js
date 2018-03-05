function handleWebPagetestResult(db, testId) {
  return db.TestResult.find().eq('webPagetests.testId', testId).resultList().then(testResult => {
    WPT Test aus webpageTests holen und je nach Type config generieren etc
    prewarm -> hasFinished updaten
    config -> smart config
    performance -> createTestResult
  })
}
