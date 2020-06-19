import { URL } from 'url';
import { baqend } from 'baqend'
import { Request, Response } from 'express'
import { getPublishedWaterfallLink } from './publishWaterfalls'

export async function post(db: baqend, req: Request, res: Response) {
  try {
    const testResultIds: string[] = req.body.ids.split(',')
    const publishedURLs: string[] = await Promise.all(
      testResultIds.map(testResultId => getPublishedWaterfallLink(db, testResultId))
    )

    const webPageTestIds = publishedURLs.map(publishedURL => new URL(publishedURL).searchParams.get('test'))
    const videoComparisonURL = `https://www.webpagetest.org/video/compare.php?tests=${webPageTestIds.join()}&thumbSize=200&ival=100&end=visual`
    res.send(videoComparisonURL)
  } catch (error) {
    db.log.error(error.message)
    res.status(404)
    res.send('Could not open video comparison for given test results')
  }
}

const html = (ids: string[]) => `
<p id="message">Redirecting to webpagetest.org ...</p>
<script>
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/v1/code/openVideoComparison', true);
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
    xhr.send("ids=${ids}");
</script>
`

export function get(db: baqend, req: Request, res: Response) {
  res.send(html(req.query.ids))
}
