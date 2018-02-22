const { runComparison } = require('./runComparison');
const { updateBulkTest } = require('./bulkTest');
const { analyzeUrl } = require('./analyzeUrl');

function createBulkTest(db, createdBy, {
  url,
  whitelist,
  speedKitConfig,
  activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
  runs = 1,
  caching = false,
  location = DEFAULT_LOCATION,
  mobile = false,
  priority = 9,
}) {
  const bulkTest = new db.BulkTest();
  bulkTest.url = url;
  bulkTest.createdBy = createdBy;
  bulkTest.hasFinished = false;
  bulkTest.location = location;
  bulkTest.mobile = mobile;
  bulkTest.runs = runs;
  bulkTest.priority = priority;
  bulkTest.completedRuns = 0;

  const options = {
    location,
    caching,
    url,
    activityTimeout,
    speedKitConfig,
    isSpeedKitComparison: bulkTest.urlAnalysis ? bulkTest.urlAnalysis.enabled : false,
    speedKitVersion: '', // FIXME save in urlAnalysis!
    mobile,
    priority,
  };

  const savedBulktest = bulkTest.save()
    .then(() => analyzeUrl(url, db))
    .then((urlAnalysis) => {
      bulkTest.urlAnalysis = urlAnalysis && new db.UrlAnalysis(urlAnalysis);

      return bulkTest.save();
    });

  // async
  savedBulktest
    .then(() => {
      // first test
      db.log.info(`Starting first of ${runs} tests`);
      bulkTest.testOverviews = [];
      return startComparison(db, bulkTest, options);
    })
    .then(firstOverview => {
      // other tests
      const newOptions = Object.assign({}, options, { speedKitConfig: firstOverview.speedKitConfig, skipPrewarm: true });
      db.log.info(`Starting other (${runs - 1}) test(s)`, { newOptions });
      const promises = new Array(runs - 1)
        .fill(null)
        .map(() => startComparison(db, bulkTest, newOptions));
      return Promise.all(promises);
    })
    .then(() => {
      db.log.info(`Bulktest successful`, {bulkTest: bulkTest.id});
    })
    .catch(error => {
      db.log.error(`Bulktest not entirely successful`, {bulkTest: bulkTest.id, error: error.stack});
    });

  return savedBulktest;
}

function startComparison(db, bulkTest, testInfo) {
  return new Promise((resolve) => {
    const comparison = runComparison(db, testInfo, resolve).then(comparison => {
      bulkTest.testOverviews.push(comparison);
    })
    .catch(error => {
      db.log.error(`Error starting a comparison`, {error: error.stack, bulkTest: bulkTest.id, testInfo})
    });
  })
  .then(testOverview => {
    updateBTest(db, bulkTest);
    return testOverview;
  });
}

function updateBTest(db, bulkTest) {
  return bulkTest.ready().then(() => bulkTest.save())
    .then(() => updateBulkTest(db, bulkTest))
    .catch((error) => {
      db.log.error(`Could not update bulktest`, { error: error.stack, bulkTest: bulkTest.id });
    });
}

exports.post = function runComparisons(db, req, res) {
  const { body } = req;
  const { createdBy = null } = body;
  let { test } = body;

  return createBulkTest(db, createdBy, test)
    .catch(error => `Error: ${error.stack}`)
    .then(result => res.send(result))
};
