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
  compressed: boolean
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
  size?: number
  loadStart: number
  loadEnd: number
}

declare interface SpeedKit {
  major: number
  minor: number
  patch: number
  stability: string | null
  year: number
  swUrl: string
  swPath: string
  appName: string
  appDomain: string | null
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

declare interface Options {
  caching: boolean
  userDataDir: string | null
  noSandbox: boolean
}

declare interface Segments {
  timings: boolean
  speedKit: boolean
  type: boolean
  stats: boolean
  screenshot: boolean
  pdf: boolean
}
