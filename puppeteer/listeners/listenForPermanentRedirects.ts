import { CDPSession } from 'puppeteer'
import { parse } from 'url'

/**
 * Listens on a CDP session for occurring permanent redirects.
 */
export async function listenForPermanentRedirects(client: CDPSession, redirects: Map<string, string>, schemeMap: Map<string, string>) {
  await client.on('Network.requestWillBeSent', ({ request: { url: toURL }, redirectResponse }) => {
    if (redirectResponse) {
      const { url: fromURL, status } = redirectResponse
      if (status === 301) {
        const { protocol: fromScheme, host: fromHost } = parse(fromURL)
        if (fromScheme === 'https:') {
          schemeMap.set(fromHost, 'https:')
        }

        redirects.set(fromURL, toURL)
      }
    }
  })
}
