import { CDPSession } from 'puppeteer'

export enum UrlType {
  BAQEND = 'baqend',
  SULU = 'sulu',
  WIX = 'wix',
  WEEBLY = 'weebly',
  JIMDO = 'jimdo',
  JOOMLA = 'joomla',
  WORDPRESS = 'wordpress',
  DRUPAL = 'drupal',
  TYPO3 = 'typo3',
  SQUARESPACE = 'squarespace',
  PHP = 'php',
}

export async function analyzeType(client: CDPSession, documentResource: Resource): Promise<UrlType | null> {
  const { headers: headersObj, url } = documentResource
  const headers = new Map(Object.entries(headersObj).map(([key, value]) => [key.toLowerCase(), value] as [string, string]))

  const via = headers.get('via')
  if (via === 'baqend' || url.includes('www.baqend.com')) {
    return UrlType.BAQEND
  }

  const xGenerator = headers.get('x-generator')
  if (xGenerator && xGenerator.toLocaleLowerCase().includes('sulu')) {
    return UrlType.SULU
  }

  if (headers.has('x-wix-request-id') || headers.has('x-wix-route-id')) {
    return UrlType.WIX
  }

  if (headers.has('x-host') && headers.get('x-host')!.includes('weebly.net')) {
    return UrlType.WEEBLY
  }

  if (headers.has('x-jimdo-instance')) {
    return UrlType.JIMDO
  }

  const { body } = await client.send('Network.getResponseBody', { requestId: documentResource.requestId })
  const result = /<meta\s+name=["']generator["']\s*content=["']([^"']+)["']/i.exec(body)
  if (result) {
    const [, generator] = result
    const s = generator.toLocaleLowerCase()
    if (s.includes('joomla')) {
      return UrlType.JOOMLA
    }
    if (s.includes('wordpress')) {
      return UrlType.WORDPRESS
    }
    if (s.includes('drupal')) {
      return UrlType.DRUPAL
    }
    if (s.includes('typo3')) {
      return UrlType.TYPO3
    }
  }

  if (body.includes('<link rel=\'dns-prefetch\' href=\'//s.w.org\' />')) {
    return UrlType.WORDPRESS
  }

  if (body.includes('<!-- This is Squarespace. -->')) {
    return UrlType.SQUARESPACE
  }

  if (headers.has('x-powered-by') && headers.get('x-powered-by')!.includes('PHP')) {
    return UrlType.PHP
  }

  return null
}
