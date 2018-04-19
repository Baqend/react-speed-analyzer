import { Request } from 'express'
import { resolve } from 'path'
import { parse } from 'url'
import { AnalyzeEvent } from '../Analyzer'
import { generateHash } from '../helpers'
import { filePutContents } from '../io'

export async function analyzeScreenshot({ page, screenshotDir }: AnalyzeEvent) {
  const { hostname } = parse(page.url())
  const filename = `${hostname.replace(/\W+/g, '-')}-${generateHash()}.png`
  const path = resolve(screenshotDir, filename)
  const screenshot = await page.screenshot()
  await filePutContents(path, screenshot)

  return (req: Request) => {
    const host = req.get('host')
    return `${host ? `http://${host}` : ''}/screenshots/${filename}`
  }
}
