import fetch, { Response } from 'node-fetch'
import { toASCII } from 'punycode'

export async function resolveUrl(url: string, retried = false): Promise<string> {
  try {
    // quick fix to allow testing of kik.de
    if (/kik\.de/.test(url) || /eu\.puma\.com/.test(url)) {
      return url
    }
    const preparedUrl = getPreparedUrl(url, retried)
    const response = await fetchUrl(preparedUrl)
    return response.url
  } catch (error: any) {
    const { name, message } = error
    const isSSLError = name === 'FetchError' && (message.includes('certificate') || message.includes('SSL'))
    if (!isSSLError || retried) {
      throw error
    }

    return resolveUrl(url, true)
  }
}

async function fetchUrl(url: string): Promise<Response> {
  const controller = new AbortController()
  const options = {
    method: 'GET',
    redirect: 'follow' as RequestRedirect,
    follow: 10,
    signal: controller.signal
  }

  setTimeout(() => controller.abort(), 30_000)
  return fetch(url, options)
}

function getPreparedUrl(url: string, forceNoSSL = false): string {
  const match = url.match(/^(https?:|)(?:\/\/|)(\[[^\]]+]|[^/:]+)(:\d+|)(.*)$/)
  if (!match) {
    throw new Error(`Invalid URL queried: ${url}`)
  }

  const [, explicitScheme, utf8Hostname, port, path] = match
  const hostname = toASCII(utf8Hostname)
  const host = `${hostname}${port}`
  const hierarchicalPart = `//${host}${path || '/'}`
  const scheme = forceNoSSL ? 'http:' : explicitScheme || 'https:'

  return `${scheme}${hierarchicalPart}`
}
