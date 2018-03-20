const fetch = require('node-fetch');

function getTestId(testResult) {
  if (testResult.testId) {
    return testResult.testId
  } else if (testResult.webPagetests && testResult.webPagetests.length){
    return testResult.webPagetests.filter(webPagetest => webPagetest.testType === 'performance')[0].testId
  }
}

function checkPublishedWaterfallLink(testResult) {
  const testNotFoundRegex = /<div id="statusText">Test not found<\/div>/;

  if (testResult.publishedSummaryUrl) {
    return fetch(testResult.publishedSummaryUrl)
      .then(response => response.text())
      .then(text => {
          const match = testNotFoundRegex.exec(text)
          if (match) {
            return null
          } else {
            return testResult.publishedSummaryUrl
          }
      })
  }
  return Promise.resolve(null)
}

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
      throw new Error('Link generation failed');
    });
}

exports.post = (db, req, res) => {
  return db.TestResult.load(req.body.id).then(testResult => {
    return checkPublishedWaterfallLink(testResult)
      .then(url => {
        if (url) {
          return url
        }
        const testId = getTestId(testResult)
        return publishWaterfall(testId, db)
          .then(publishedSummaryUrl => {
            return testResult.partialUpdate().set('publishedSummaryUrl', publishedSummaryUrl).execute().then(() => {
              return publishedSummaryUrl;
            })
          })
      })
  })
  .then(publishedSummaryUrl => {
    res.send(publishedSummaryUrl)
  })
  .catch(error => {
    db.log.error(`Waterfall publishing failed`, {testResult: req.body.id, error: error.stack});
    res.status(404);
    res.send('Link generation failed');
  });
};

const html = (id) => `
<p id="message">Redirecting to webpagetest.org ...</p>
<script>
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/v1/code/publishWaterfalls', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
      if (xhr.status === 200) {
        window.location.href = this.responseText;
      } else {
        document.getElementById('message').innerHTML = 'Could not find test result'
        setTimeout(function() {
          window.close()
        }, 5000)
      }
    };
    xhr.send("id=${id}");
</script>
`

exports.get = function(db, req, res) {
  res.send(html(req.query.id));
};
