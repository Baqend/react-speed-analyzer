import { CDPSession } from 'puppeteer'
import { parse } from "url"

const sizeCache = new Map<string, number>()

export async function listenForResources(client: CDPSession): Promise<ResourceMap> {
  const resources: ResourceMap = new Map()

  // Track resources whose response was received
  await client.on('Network.responseReceived', ({ requestId, type, timestamp, response }) => {
    const { url, headers: bareHeaders, status, mimeType, protocol, fromServiceWorker, fromDiskCache, timing } = response

    const headers = new Map(Object.entries(bareHeaders).map(([key, value]) => [key.toLowerCase(), value] as [string, string]))

    const { host, protocol: scheme, pathname } = parse(url)

    const compressed: boolean = headers.has('content-encoding') && headers.get('content-encoding').toLowerCase() !== 'identity'

    const loadStart = timing ? timing.requestTime : -1
    resources.set(requestId, {
      requestId,
      url,
      headers,
      compressed,
      type,
      host,
      scheme,
      pathname,
      status,
      mimeType,
      protocol,
      fromServiceWorker,
      fromDiskCache,
      timing,
      loadStart,
      loadEnd: -1,
      size: sizeCache.get(url),
    })
  })

  // Track resources which have been finished loading
  await client.on('Network.loadingFinished', ({ requestId, timestamp, encodedDataLength }) => {
    const resource = resources.get(requestId)
    if (resource) {
      if (!resource.fromDiskCache && !resource.fromServiceWorker) {
        sizeCache.set(resource.url, encodedDataLength)
        resource.size = encodedDataLength
      }
      resource.loadEnd = timestamp
    }
  })

  return resources
}
