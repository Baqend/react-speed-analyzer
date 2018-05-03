import { baqend, model } from 'baqend'
import fetch from 'node-fetch'
import { toFile } from './_toFile'
import credentials from './credentials'

export type PuppeteerSegment = 'timings' | 'stats' | 'type' | 'speedKit' | 'screenshot' | 'pdf' | 'domains'

export class Puppeteer {

  constructor(
    private readonly db: baqend,
  ) {
  }

  async analyze(url: string): Promise<model.Puppeteer> {
    try {
      const data = await this.fetchData(url, 'stats', 'type', 'speedKit', 'screenshot', 'domains')
      this.db.log.info(`Received puppeteer data for ${url}`, { data })
      data.stats = new this.db.PuppeteerStats(data.stats)
      data.type = new this.db.PuppeteerType(data.type)
      data.speedKit = data.speedKit ? new this.db.PuppeteerSpeedKit(data.speedKit) : null
      data.screenshot = await toFile(this.db, data.screenshot, `/www/screenshots/${ Date.now() }.png`)

      return new this.db.Puppeteer(data)
    } catch (error) {
      this.db.log.error('Puppeteer error', { error: error.stack, url });
      throw error;
    }
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
}
