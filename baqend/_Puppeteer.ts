import { baqend, model } from 'baqend'
import fetch, { Response } from 'node-fetch'
import { ConfigGenerator } from './_ConfigGenerator'
import { generateHash, urlToFilename } from './_helpers'
import { DataType, Serializer } from './_Serializer'
import { toFile } from './_toFile'
import credentials from './credentials'

export type PuppeteerSegment = 'timings' | 'stats' | 'type' | 'speedKit' | 'screenshot' | 'screenshotData' | 'pdf' | 'domains'

export class Puppeteer {

  constructor(
    private readonly db: baqend,
    private readonly configGenerator: ConfigGenerator,
    private readonly serializer: Serializer,
  ) {
  }

  async analyze(url: string, mobile: boolean = false): Promise<model.Puppeteer> {
    try {
      const data = await this.postToServer(url, mobile, 'stats', 'type', 'speedKit', 'screenshotData', 'domains')
      this.db.log.info(`Received puppeteer data for ${url}`, { data })

      // Generate smart config
      const smartConfig = await this.configGenerator.generateSmart(data.url, mobile, data)

      // Create persistable object
      const puppeteer: model.Puppeteer = new this.db.Puppeteer()
      puppeteer.url = data.url
      puppeteer.displayUrl = data.displayUrl
      puppeteer.protocol = data.protocol
      puppeteer.domains = data.domains
      puppeteer.screenshot = await toFile(this.db, data.screenshotData, `/www/screenshots/${urlToFilename(url)}/${mobile ? 'mobile' : 'desktop'}/${generateHash()}.jpg`)
      puppeteer.type = new this.db.PuppeteerType(data.type)
      puppeteer.stats = new this.db.PuppeteerStats(data.stats)
      puppeteer.speedKit = data.speedKit ? new this.db.PuppeteerSpeedKit(data.speedKit) : null
      puppeteer.smartConfig = this.serializer.serialize(smartConfig, DataType.JSON)

      return puppeteer
    } catch (error) {
      this.db.log.error('Puppeteer error', { error: error.stack, url })
      throw error
    }
  }

  /**
   * Posts the request to the server.
   */
  private async postToServer(query: string, mobile: boolean, ...segments: PuppeteerSegment[]): Promise<any> {
    const host = credentials.puppeteer_host
    const response = await this.sendJsonRequest(`http://${host}/`, { query, mobile, segments })
    if (response.status !== 200) {
      const { message, status, stack } = await response.json()
      this.db.log.error(`Puppeteer Error: ${message}`, { message, status, stack })

      const error = new Error(`Puppeteer failed with status ${status}: ${message}`)
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

    return fetch(url, { method, headers, body })
  }
}
