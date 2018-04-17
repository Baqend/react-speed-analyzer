import { writeFile } from 'fs'
import { resolve } from 'path'
import { Page } from 'puppeteer'
import { parse } from 'url'

function generateHash(): string {
  const chars = 'ABCDEFGHIJKLMOPQRSTUVWXYZabcdefghijklmopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }

  return result
}

export async function analyzeScreenshot(page: Page, dir: string, host: string | undefined) {
  const { hostname } = parse(page.url())
  const filename = `${hostname.replace(/\W+/g, '-')}-${generateHash()}.png`
  const path = resolve(dir, filename)
  const wwwPath = `${host ? `http://${host}` : ''}/screenshots/${filename}`
  const screenshot = await page.screenshot()
  return new Promise((resolve, reject) => {
    writeFile(path, screenshot, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve({ screenshot: wwwPath })
      }
    })
  })
}
