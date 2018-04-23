import { CDPSession } from 'puppeteer'
import { parse } from 'url'

/**
 * Listens on a CDP session for occurring permanent redirects.
 */
export async function listenForPermanentRedirects(client: CDPSession, redirectCb: (fromURL: string, toURL: string) => void, sslCb: (host: string) => void) {
  await client.on('Network.requestWillBeSent', ({ request: { url: toURL }, redirectResponse }) => {
    if (redirectResponse) {
      const { url: fromURL, status } = redirectResponse
      if (status === 301) {
        const { protocol: fromScheme, host: fromHost } = parse(fromURL)
        if (fromScheme === 'https:') {
          sslCb(fromHost)
        }

        redirectCb(fromURL, toURL)
      }
    }
  })
}
