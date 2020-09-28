import { baqend, model } from 'baqend'
import fetch, { Response } from 'node-fetch'
import { ConfigGenerator } from './_ConfigGenerator'
import { generateHash, urlToFilename } from './_helpers'
import { DataType, Serializer } from './_Serializer'
import { toFile } from './_toFile'
import credentials from './credentials'

const DEFAULT_TIMEOUT: number = 60_000;

export enum PuppeteerSegment {
  DOMAINS = 'domains',
  PDF = 'pdf',
  RESOURCES = 'resources',
  SCREENSHOT = 'screenshot',
  SCREENSHOT_DATA = 'screenshotData',
  SECURITY = 'security',
  SERVICE_WORKERS = 'serviceWorkers',
  SPEED_KIT = 'speedKit',
  STATS = 'stats',
  TIMINGS = 'timings',
  TYPE = 'type',
  URLS = 'urls',
}

/**
 * Resource type as it was perceived by the rendering engine.
 */
export enum ResourceType {
  DOCUMENT = 'Document',
  STYLESHEET = 'Stylesheet',
  IMAGE = 'Image',
  MEDIA = 'Media',
  FONT = 'Font',
  SCRIPT = 'Script',
  TEXT_TRACK = 'TextTrack',
  XHR = 'XHR',
  FETCH = 'Fetch',
  EVENT_SOURCE = 'EventSource',
  WEB_SOCKET = 'WebSocket',
  MANIFEST = 'Manifest',
  SIGNED_EXCHANGE = 'SignedExchange',
  PING = 'Ping',
  CSP_VIOLATION_REPORT = 'CSPViolationReport',
  OTHER = 'Other',
}

export interface PuppeteerResponse {
  query: string
  mobile: boolean
  url: string
  displayUrl: string
  scheme: string
  host: string
  protocol: string

  domains?: string[]
  pdf?: string
  resources?: PuppeteerResource[]
  screenshot?: string
  screenshotData?: string
  serviceWorkers?: Array<{ scope: string, source: string }>
  speedKit?: PuppeteerSpeedKit | null
  stats?: { [key: string]: number }
  timings?: { [key: string]: number }
  type?: { [key: string]: string | null }
  urls?: string[]
}

export interface PuppeteerResource {
  requestId: string
  headers: { [key: string]: string }
  cookies: PuppeteerCookie[]
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
  fromDataURI: boolean
  timing: PuppeteerResourceTiming
  size?: number
  loadStart: number
  loadEnd: number
}

export interface PuppeteerSpeedKit {
  major: number
  minor: number
  patch: number
  stability: string
  year: number
  swUrl: string
  swPath: string
  appName: string
  appDomain: string | null
  config: any
}

export interface PuppeteerResourceTiming {
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
}

export interface PuppeteerCookie {
  name: string
  value: string
  httpOnly: boolean
  secure: boolean
  path?: string
  expires?: Date
  domain?: string
  maxAge?: number
  sameSite?: 'strict' | 'lax'
}

export class Puppeteer {

  constructor(
    private readonly db: baqend,
    private readonly configGenerator: ConfigGenerator,
    private readonly serializer: Serializer,
  ) {
  }

  async analyze(
    url: string,
    mobile: boolean = false,
    location: string = 'eu',
    thirdParty: boolean = true,
    preload: boolean = false,
    app: string = credentials.app,
    timeout: number = DEFAULT_TIMEOUT,
  ): Promise<model.Puppeteer> {
    try {
      const language = location.startsWith('us') ? 'en-US' : 'de-DE'
      const data = await this.postToServer(
        url,
        mobile,
        language,
        timeout,
        // The segments to request:
        PuppeteerSegment.RESOURCES,
        PuppeteerSegment.STATS,
        PuppeteerSegment.TYPE,
        PuppeteerSegment.SPEED_KIT,
        PuppeteerSegment.SCREENSHOT_DATA,
        PuppeteerSegment.DOMAINS,
        PuppeteerSegment.SERVICE_WORKERS,
      )

      this.db.log.info(`Received puppeteer data for ${url}`, { data })

      // Generate smart config
      const { url: normalizedUrl, displayUrl, protocol, host, scheme } = data
      const domains = data.domains!
      const resources = data.resources!
      const isImageOptimization = false // location.includes('-docker') // FIXME only active for new test setup
      const smartConfig =
        await this.configGenerator.generateSmart(normalizedUrl, mobile, thirdParty, isImageOptimization, preload, app, {
          host,
          domains,
          resources,
        })

      // Create persistable object
      const puppeteer: model.Puppeteer = new this.db.Puppeteer()
      puppeteer.url = normalizedUrl
      puppeteer.displayUrl = displayUrl
      puppeteer.scheme = scheme
      puppeteer.host = host
      puppeteer.protocol = protocol
      puppeteer.domains = domains
      puppeteer.screenshot = await toFile(this.db, data.screenshotData!, `/www/screenshots/${urlToFilename(url)}/${mobile ? 'mobile' : 'desktop'}/${generateHash()}.jpg`)
      puppeteer.type = new this.db.PuppeteerType(data.type!)
      puppeteer.stats = new this.db.PuppeteerStats(data.stats!)
      puppeteer.speedKit = data.speedKit ? new this.db.PuppeteerSpeedKit(data.speedKit) : null
      puppeteer.smartConfig = this.serializer.serialize(smartConfig, DataType.JSON)

      const serviceWorkers: model.PuppeteerServiceWorkers[] = []
      data.serviceWorkers && data.serviceWorkers.forEach((serviceWorker) => {
        serviceWorkers.push(new this.db.PuppeteerServiceWorkers(serviceWorker))
      })

      puppeteer.serviceWorkers = serviceWorkers.length > 0 ? serviceWorkers : null

      return puppeteer
    } catch (error) {
      this.db.log.error('Puppeteer error', { error: error.stack, url })
      throw error
    }
  }

  /**
   * Posts the request to the server.
   */
  private async postToServer(query: string, mobile: boolean, language: string, timeout: number | null, ...segments: PuppeteerSegment[]): Promise<PuppeteerResponse> {
    const host = credentials.puppeteer_host
    const defaultBody = { query, mobile, language, segments }
    const bodyObject = timeout ? Object.assign(defaultBody, { timeout } ) : defaultBody

    const response = await this.sendJsonRequest(`http://${host}/`, bodyObject)
    if (response.status !== 200) {
      const { message, status, stack } = await response.json()
      const reasonPhrase = this.reasonPhraseForStatus(status)
      this.db.log.error(`Puppeteer Error: ${message}`, { message, status, reasonPhrase, stack })

      const error = new Error(message)
      error.name = 'PuppeteerError'
      Object.defineProperty(error, 'status', { value: status })

      throw error
    }

    return response.json()
  }

  /**
   * Sends a JSON with a POST request.
   */
  private async sendJsonRequest(url: string, bodyObj: any): Promise<Response> {
    const method = 'POST'
    const headers = { 'content-type': 'application/json' }
    const body = JSON.stringify(bodyObj)
    const timeout = 0

    return fetch(url, { method, headers, body, timeout })
  }

  /**
   * Returns the reason phrase for a given status code.
   */
  private reasonPhraseForStatus(status: number): string {
    const phrases = {
      400: 'Bad Request',
      404: 'Not Found',
      405: 'Method Not Allowed',
      502: 'Bad Gateway',
      504: 'Gateway Timeout',
      552: 'Gateway Insecure',
      555: 'Gateway Closed',
    } as { [status: number]: string | undefined }

    const phrase = phrases[status]
    if (phrase) {
      return phrase
    }

    return 'Internal Server Error'
  }
}
