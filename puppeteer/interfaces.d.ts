declare interface ResourceTiming {
  requestTime: number
  proxyStart: number
  proxyEnd: number
  dnsStart: number
  dnsEnd: number
  connectStart: number
  connectEnd: number
  sslStart: number
  sslEnd: number
  workerStart: number
  workerReady: number
  sendStart: number
  sendEnd: number
  pushStart: number
  pushEnd: number
  receiveHeadersEnd: number

  [key: string]: number
}

declare interface Resource {
  requestId: string
  headers: Map<string, string>
  url: string
  type: string
  host: string
  scheme: string
  pathname: string
  status: number
  mimeType: string
  protocol: string
  fromServiceWorker: boolean
  fromDiskCache: boolean
  timing: ResourceTiming
}

declare interface SpeedKit {
  version: string,
  year: number,
  swUrl: string,
  swPath: string,
  appName: string,
  appDomain: string | null,
  config: any
}

declare interface Timings {
  dnsLookup: number
  initialConnection: number
  proxyNegotiation: number
  serviceWorker: number
  ssl: number
  requestSent: number
  ttfb: number
  firstPaint: number
  firstContentfulPaint: number
  domContentLoaded: number
  fullyLoaded: number
}

declare interface ServiceWorkerRegistration {
  registrationId: string
  scopeURL: string
  isDeleted: boolean
}
