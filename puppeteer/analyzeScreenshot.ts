import { resolve } from 'path'
import { Page } from 'puppeteer'
import { parse } from 'url'
import { filePutContents, generateHash } from './helpers'

export async function analyzeScreenshot(page: Page, dir: string, host: string | undefined) {
  const { hostname } = parse(page.url())
  const filename = `${hostname.replace(/\W+/g, '-')}-${generateHash()}.png`
  const path = resolve(dir, filename)
  const wwwPath = `${host ? `http://${host}` : ''}/screenshots/${filename}`
  const screenshot = await page.screenshot()
  await filePutContents(path, screenshot)

  return { screenshot: wwwPath }
}
