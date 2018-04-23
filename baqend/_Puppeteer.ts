import { baqend, model } from 'baqend'
import fetch from 'node-fetch'
import credentials from './credentials'

export type PuppeteerSegment = 'timings' | 'stats' | 'type' | 'speedKit' | 'screenshot' | 'pdf'

export class Puppeteer {

  constructor(
    private readonly db: baqend,
  ) {
  }

  async analyze(url: string): Promise<model.Puppeteer> {
    const data = await this.fetchData(url, 'stats', 'type', 'speedKit', 'screenshot')
    this.db.log.info(`Received puppeteer data for ${url}`, { data })
    data.stats = new this.db.PuppeteerStats(data.stats)
    data.type = new this.db.PuppeteerType(data.type)
    data.speedKit = data.speedKit ? new this.db.PuppeteerSpeedKit(data.speedKit) : null

    // Get screenshot as base64
    try {
      data.screenshot = await this.urlToBase64(data.screenshot)
    } catch ({ message }) {
      this.db.log.warn(`Could not download screenshot from puppeteer: ${message}`)
      data.screenshot = null
    }

    return new this.db.Puppeteer(data)
  }

  private async fetchData(url: string, ...segments: PuppeteerSegment[]): Promise<any> {
    const host = credentials.puppeteer_host
    const segmentStr = segments.length ? `${segments.join(';')};` : ''
    const response = await fetch(`http://${host}/${segmentStr}${url}`)
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
   * Download an asset and output it to a Base64 string.
   */
  private async urlToBase64(url: string): Promise<string> {
    const response = await fetch(url)
    const buffer = await response.buffer()

    return buffer.toString('base64')
  }
}
