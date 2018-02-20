const { createBulkTest } = require('./bulkTest');

exports.run = function(db, jobsStatus, jobsDefinition) {
  db.log.info('Running testseries job');
  return jobsDefinition.testseries.load().then(series => {
    db.log.info('Found test series, starting new bulk test');
    const entry = new db.TestEntry();
    series.testEntries = appendEntry(series.testEntries, entry);

    entry.time = new Date();

    const options = clean({
      url: series.url,
      whitelist: series.whitelist,
      runs: series.runs,
      location: series.location,
      mobile: series.mobile,
      speedKitConfig: series.speedKitConfig? JSON.stringify(series.speedKitConfig) : '',
    });

    return createBulkTest(db, null, options).then(bulktest => {
      entry.test = bulktest;
      return series.save();
    });
  });
};

function clean(obj) {
  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      delete obj[key];
    }
  }
  return obj;
}

function appendEntry(list, elem) {
  if (!list) {
    return [elem];
  }

  list.push(elem);
  return list;
}
