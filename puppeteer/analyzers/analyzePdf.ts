import { resolve } from 'path'
import { Page } from 'puppeteer'
import { parse } from 'url'
import { generateHash } from '../helpers'
import { filePutContents } from '../io'

export async function analyzePdf(page: Page, dir: string, host: string | undefined) {
  const { hostname } = parse(page.url())
  const filename = `${hostname.replace(/\W+/g, '-')}-${generateHash()}.pdf`
  const path = resolve(dir, filename)
  const wwwPath = `${host ? `http://${host}` : ''}/screenshots/${filename}`
  const pdf = await page.pdf({ format: 'A4' })
  await filePutContents(path, pdf)

  return { pdf: wwwPath }
}
