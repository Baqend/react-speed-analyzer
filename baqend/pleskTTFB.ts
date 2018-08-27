import { baqend } from 'baqend'
import { Request, Response } from 'express'
import fetch from 'node-fetch'

interface PleskTTFBRequest {
  url: string | string[]
}

interface PleskTTFBResponse {
  url: string
  ttfb: number
}

/**
 * Calculates the TTFB of a given URL.
 */
export async function calcTTFB(url: string): Promise<number> {
  const requestStart = Date.now()
  await fetch(url)

  return Date.now() - requestStart
}

async function pleskTTFB(urls: string[]): Promise<PleskTTFBResponse[]> {
  return Promise.all(urls.map(url => calcTTFB(url).then(ttfb => ({ url, ttfb }))))
}

function ensureArray<T>(optArray: T | T[]): T[] {
  if (optArray instanceof Array) {
    return optArray
  }

  return [optArray]
}

/**
 * Baqend code API call.
 */
export async function post(db: baqend, req: Request, res: Response): Promise<void> {
  const { url } = req.body as PleskTTFBRequest
  const data = await pleskTTFB(ensureArray(url))

  res.send(data)
}
