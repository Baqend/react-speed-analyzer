import { Request } from 'express'
import { resolve } from 'path'
import { parse } from 'url'
import { AnalyzeEvent } from '../Analyzer'
import { generateHash } from '../helpers'
import { filePutContents } from '../io'

export async function analyzePdf({ page, screenshotDir }: AnalyzeEvent) {
  const { hostname } = parse(page.url())
  const filename = `${hostname.replace(/\W+/g, '-')}-${generateHash()}.pdf`
  const path = resolve(screenshotDir, filename)
  const pdf = await page.pdf({ format: 'A4' })
  await filePutContents(path, pdf)

  return (req: Request) => {
    const host = req.get('host')
    return `${host ? `http://${host}` : ''}/screenshots/${filename}`
  }
}
