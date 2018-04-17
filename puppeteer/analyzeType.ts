import { CDPSession } from 'puppeteer'

export enum Framework {
  BAQEND = 'baqend',
  DRUPAL = 'drupal',
  EXPRESS = 'express',
  JIMDO = 'jimdo',
  JOOMLA = 'joomla',
  SQUARESPACE = 'squarespace',
  SULU = 'sulu',
  TYPO3 = 'typo3',
  WEEBLY = 'weebly',
  WIX = 'wix',
  WORDPRESS = 'wordpress',
}

export enum Language {
  JAVASCRIPT = 'javascript',
  PHP = 'php',
}

export enum Server {
  APACHE = 'apache',
  NGINX = 'nginx',
}

export async function analyzeType(client: CDPSession, documentResource: Resource): Promise<{ framework: Framework | null, language: Language | null, server: Server | null }> {
  const { headers: headersObj, url } = documentResource
  const headers = new Map(Object.entries(headersObj).map(([key, value]) => [key.toLowerCase(), value] as [string, string]))
  const server = getServer(headers)

  const via = headers.get('via')
  if (via === 'baqend' || url.includes('www.baqend.com')) {
    return { framework: Framework.BAQEND, language: null, server }
  }

  const xPoweredBy = headers.get('x-powered-by')
  if (xPoweredBy && xPoweredBy.includes('Express')) {
    return { framework: Framework.EXPRESS, language: Language.JAVASCRIPT, server }
  }

  const xGenerator = headers.get('x-generator')
  if (xGenerator && xGenerator.toLocaleLowerCase().includes('sulu')) {
    return { framework: Framework.SULU, language: Language.PHP, server }
  }

  if (headers.has('x-wix-request-id') || headers.has('x-wix-route-id')) {
    return { framework: Framework.WIX, language: null, server }
  }

  if (headers.has('x-host') && headers.get('x-host')!.includes('weebly.net')) {
    return { framework: Framework.WEEBLY, language: null, server }
  }

  if (headers.has('x-jimdo-instance')) {
    return { framework: Framework.JIMDO, language: null, server }
  }

  const { body } = await client.send('Network.getResponseBody', { requestId: documentResource.requestId })
  const result = /<meta\s+name=["']generator["']\s*content=["']([^"']+)["']/i.exec(body)
  if (result) {
    const [, generator] = result
    const s = generator.toLocaleLowerCase()
    if (s.includes('joomla')) {
      return { framework: Framework.JOOMLA, language: Language.PHP, server }
    }
    if (s.includes('wordpress')) {
      return { framework: Framework.WORDPRESS, language: Language.PHP, server }
    }
    if (s.includes('drupal')) {
      return { framework: Framework.DRUPAL, language: Language.PHP, server }
    }
    if (s.includes('typo3')) {
      return { framework: Framework.TYPO3, language: Language.PHP, server }
    }
  }

  if (body.includes('<link rel=\'dns-prefetch\' href=\'//s.w.org\' />')) {
    return { framework: Framework.WORDPRESS, language: Language.PHP, server }
  }

  if (body.includes('<!-- This is Squarespace. -->')) {
    return { framework: Framework.SQUARESPACE, language: null, server }
  }

  // Fallback: detect any PHP
  if (xPoweredBy && xPoweredBy.includes('PHP')) {
    return { framework: null, language: Language.PHP, server }
  }

  return { framework: null, language: null, server }
}

function getServer(headers: Map<string, string>): Server | null {
  if (headers.has('server')) {
    const s = headers.get('server')!.toLowerCase()
    if (s.includes('nginx')) {
      return Server.NGINX
    }

    if (s.includes('apache')) {
      return Server.APACHE
    }
  }

  return null
}
