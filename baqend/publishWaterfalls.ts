import fetch from 'node-fetch'
import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { TestType } from './_WebPagetestResultHandler'

function getWebPageTestId(testResult: model.TestResult): string | null {
  // Legacy for older test that do not store the single tests within the webPagetests object
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

  return fetch(`http://wpt.baqend.com//publish.php?test=${testId}`)
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

export async function getPublishedWaterfallLink(db: baqend, testResultId: string): Promise<string> {
  const testResult: model.TestResult = await db.TestResult.load(testResultId)
  let url = await checkPublishedWaterfallLink(testResult)
  if (url) {
    return url
  }

  const webPageTestId = getWebPageTestId(testResult)
  if (!webPageTestId) {
    throw new Error('publishWaterfalls: Could not find test ID')
  }

  const publishedURL = await publishWaterfall(webPageTestId, db)
  await (testResult as any).partialUpdate().set('publishedSummaryUrl', publishedURL).execute()
  return publishedURL
}

export async function post(db: baqend, req: Request, res: Response) {
  try {
    const publishedWaterfallLink = await getPublishedWaterfallLink(db, req.body.id)
    res.send(publishedWaterfallLink)
  } catch (error) {
    db.log.error(error.message)
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
