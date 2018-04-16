import fetch from 'node-fetch'
import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { TestType } from './_WebPagetestResultHandler'

function getTestId(testResult: model.TestResult): string | null {
  if (testResult.testId) {
    return testResult.testId
  }

  if (testResult.webPagetests && testResult.webPagetests.length){
    const performanceTest = testResult.webPagetests.find(webPagetest => webPagetest.testType === TestType.PERFORMANCE)
    if (performanceTest) {
      return performanceTest.testId
    }
  }

  return null
}

function checkPublishedWaterfallLink(testResult: model.TestResult): Promise<string | null> {
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

function publishWaterfall(testId: string, db: baqend) {
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

export async function post(db: baqend, req: Request, res: Response) {
  try {
    const testResult: model.TestResult = await db.TestResult.load(req.body.id)
    let url = await checkPublishedWaterfallLink(testResult)
    if (!url) {
      const testId = getTestId(testResult)
      if (!testId) {
        db.log.error('publishWaterfalls: Could not find test ID')
        res.status(404)
        res.send('Link generation failed')
        return
      }

      url = await publishWaterfall(testId, db)
        .then(publishedSummaryUrl => {
          return (testResult as any).partialUpdate().set('publishedSummaryUrl', publishedSummaryUrl).execute().then(() => {
            return publishedSummaryUrl
          })
        })
    }

    res.send(url)
  } catch (error) {
    db.log.error(`Waterfall publishing failed`, { testResult: req.body.id, error: error.stack })
    res.status(404)
    res.send('Link generation failed')
  }
}

const html = (id: string) => `
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

export function get(db: baqend, req: Request, res: Response) {
  res.send(html(req.query.id))
}
