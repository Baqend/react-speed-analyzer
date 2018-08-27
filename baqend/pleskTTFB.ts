import { baqend } from 'baqend'
import { Request, Response } from 'express'
import fetch from 'node-fetch'

interface PleskTTFBRequest {
  url: string | string[]
}

interface PleskTTFBResponse {
  url: string
  ttfb?: number
  error?: string
}

/**
 * Calculates the TTFB of a given URL.
 */
export async function calcTTFB(url: string): Promise<PleskTTFBResponse> {
  const requestStart = Date.now()
  await fetch(url, { timeout: 15_000 })

  const ttfb = Date.now() - requestStart

  return { url, ttfb }
}

async function pleskTTFB(urls: string[]): Promise<PleskTTFBResponse[]> {
  return Promise.all(urls.map(url => calcTTFB(url).catch(({ message: error }) => ({ url, error }))))
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
