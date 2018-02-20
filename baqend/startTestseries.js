function createTestseries(db, url, cronpattern, end, options) {
  const series = new db.Testseries();
  series.url = url;
  series.start = new Date(options.start || Date.now());
  series.cronpattern = cronpattern;
  series.end = new Date(end);
  series.runs = options.runs;
  series.location = options.location;
  series.mobile = options.mobile;
  series.whitelist = options.whitelist;
  series.speedKitConfig = options.speedKitConfig;
  series.testEntries = [];

  return series.save();
}

exports.post = function(db, req, res) {
  const { body } = req;
  db.log.info('Starting testseries', body);

  const {
    url,
    cronpattern,
    end
  } = body;

  const options = {
    start,
    runs,
    location,
    mobile,
    whitelist,
    speedKitConfig,
    testEntries
  } = body;


  return createTestseries(db, url, cronpattern, end, options).then(series => {
    const job = new db['jobs.Definition']();
    job.module = 'testseriesJob';
    job.cronpattern = series.cronpattern;
    job.startsAt = series.start;
    job.expiresAt = series.end;
    job.testseries = series;
    return job.save();
  }).then(job => res.send({res: 'Testseries scheduled'}));
};



// JSON.stringify({
//   url: "https://www.cnouch.de/",
//   cronpattern: "0 */2 * * * *",
//   end: new Date(Date.now() + (30*60*1000)),
//   runs: 2,
//   speedKitConfig: {
//     appName: "makefast-dev",
//     whitelist: [{ host: [ "www.cnouch.de", "i.cnouch.de", "img.idealo.com", "static.criteo.net", "img.billiger.de", "static.trbo.com" ]}, { url: [ "www.google-analytics.com/analytics.js", "https://www.google-analytics.com/plugins/ua/ec.js" ]}],
//     userAgentDetection: false,
//   }
// })
