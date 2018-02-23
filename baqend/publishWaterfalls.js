const fetch = require('node-fetch');

exports.call = function callQueueTest(db, data, req) {

  return db.TestOverview.load(data.testId, { depth: 2 }).then(test => {

    const competitorId = test.competitorTestResult.testId;
    const speedKitId = test.speedKitTestResult.testId;
    const compLink = publishWaterfall(competitorId, db);
    const skLink = publishWaterfall(speedKitId, db);

    return Promise.all([ skLink, compLink ])
      .then(([ speedKit, competitor ]) => {
        return { speedKit, competitor };
      });

  }).catch(error => {
    db.log.error(`Waterfall publishing failed`, {testOverview: data.testId, error: error.stack});
    return { speedKit: 'Link generation failed', competitor: 'Link generation failed' };
  });
};

function publishWaterfall(testId, db) {
  const linkRegex = /href(?:s*)=(?:s*)(?:\\?)"(https:\/\/www\.webpagetest\.org\/results\.php\?.*?)(?:\\?)"(?:s*)>/;

  return fetch(`http://ec2-18-195-220-131.eu-central-1.compute.amazonaws.com/publish.php?test=${testId}`)
    .then(response => response.text())
    .then(text => {
      const match = linkRegex.exec(text);
      if (match && match[1]) {
        return match[1];
      }

      db.log.warn('Waterfall publishing failed.', { linkRegex: linkRegex.toString(), match: match, testId, text });
      return 'Link generation failed';
    });
}
