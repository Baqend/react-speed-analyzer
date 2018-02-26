const fetch = require('node-fetch');

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

exports.post = (db, req, res) => {
  return db.TestResult.load(req.body.id).then(testResult => {
    if (testResult.publishedSummaryUrl) {
        return testResult.publishedSummaryUrl
    }
    return publishWaterfall(testResult.testId, db).then(publishedSummaryUrl => {
        return testResult.partialUpdate().set('publishedSummaryUrl', publishedSummaryUrl).execute().then(() => {
            return publishedSummaryUrl;
        })
    })
  })
  .then(publishedSummaryUrl => {
    res.send(publishedSummaryUrl)
  })
  .catch(error => {
    db.log.error(`Waterfall publishing failed`, {testResult: req.body.id, error: error.stack});
    return 'Link generation failed';
  });
};

const html = (id) => `
<p>Redirecting to webpagetest.org ...</p>
<script>
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/v1/code/publishWaterfalls', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        window.location.href = this.responseText
    };
    xhr.send("id=${id}");
</script>
`

exports.get = function(db, req, res) {
  res.send(html(req.query.id));
};
