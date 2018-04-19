import { Page } from 'puppeteer'

export interface Type {
  framework: Framework | null
  language: Language | null
  server: Server | null
}

export enum Framework {
  BAQEND = 'baqend',
  DRUPAL = 'drupal',
  EXPRESS = 'express',
  JIMDO = 'jimdo',
  JOOMLA = 'joomla',
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

const typeCache = new Map<string, Type>()

export async function analyzeType(page: Page, documentResource: Resource): Promise<{ type: Type }> {
  const etag = documentResource.headers.get('etag')
  if (etag) {
    if (typeCache.has(etag)) {
      const type = typeCache.get(etag)

      return { type }
    }

    const type = await retrieveType(page, documentResource)
    typeCache.set(etag, type)

    return { type }
  }

  const type = await retrieveType(page, documentResource)

  return { type }
}

async function retrieveType(page: Page, documentResource: Resource): Promise<Type> {
  const { headers, url } = documentResource
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

  const result = await page.evaluate(() => {
    const generator = document.querySelector('meta[name="generator"]')
    if (generator) {
      return generator.getAttribute('content')
    }

    return null
  })
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

  if (await page.evaluate(() => {
    return !!document.querySelector('link[rel="dns-prefetch"][href="//s.w.org"]')
  })) {
    return { framework: Framework.WORDPRESS, language: Language.PHP, server }
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
