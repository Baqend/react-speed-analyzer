import fetch from 'node-fetch'
import { baqend, binding } from 'baqend'
import credentials from './credentials'

const API_KEY = credentials.google_api_key;
const API_URL = 'https://www.googleapis.com/pagespeedonline/v1/runPagespeed?';

export interface PageSpeedResult {
  url: string
  mobile: boolean
  domains: number
  requests: number
  bytes: number
  screenshot: binding.File
}

/**
 * @param db The Baqend instance.
 * @param url The URL to run the Page Speed tests on.
 * @param mobile Run the test as a mobile client.
 * @return
 */
export async function callPageSpeed(db: baqend, url: string, mobile: boolean): Promise<PageSpeedResult> {
  const query = [
    `url=${encodeURIComponent(url)}`,
    'screenshot=true',
    `strategy=${mobile ? 'mobile' : 'desktop'}`,
    `key=${API_KEY}`,
  ].join('&')

  const response = await fetch(API_URL + query, { method: 'get' })
  const [ok, data] = await Promise.all([response.ok, response.json()])
  if (!ok) {
    throw new Error(data.error.errors[0].message)
  }

  const { pageStats, screenshot } = data
  const domains = pageStats.numberHosts || 0
  const requests = pageStats.numberResources || 0

  let bytes = parseInt(pageStats.htmlResponseBytes, 10) || 0
  bytes += parseInt(pageStats.cssResponseBytes, 10) || 0
  bytes += parseInt(pageStats.imageResponseBytes, 10) || 0
  bytes += parseInt(pageStats.javascriptResponseBytes, 10) || 0
  bytes += parseInt(pageStats.otherResponseBytes, 10) || 0

  const file = await new db.File({
    data: screenshot.data,
    type: 'base64',
    mimeType: screenshot.mime_type,
    path: `/www/screenshots/${ Date.now() }.jpg`
  }).upload()

  return { url, mobile, domains, requests, bytes, screenshot: file }
}
