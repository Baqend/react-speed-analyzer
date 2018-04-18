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
    const data = await this.fetchData(url, 'stats', 'type', 'speedKit')
    this.db.log.info(`Received puppeteer data for ${url}`, { data })
    data.stats = new this.db.PuppeteerStats(data.stats)
    data.type = new this.db.PuppeteerType(data.type)
    data.speedKit = data.speedKit ? new this.db.PuppeteerSpeedKit(data.speedKit) : null

    return new this.db.Puppeteer(data)
  }

  private async fetchData(url: string, ...segments: PuppeteerSegment[]): Promise<any> {
    const host = credentials.puppeteer_host
    const segmentStr = segments.length ? `${segments.join(';')};` : ''
    const response = await fetch(`http://${host}/${segmentStr}${url}`)

    return response.json()
  }
}
