import fetch from 'node-fetch'
import URL from 'url'
import { baqend } from 'baqend'
import { Config } from './_Config'
import { DataType, Serializer } from './_Serializer'
import credentials from './credentials'

const ORIGIN = credentials.makefast_ip

async function fetchConfig(url: string, timeout: number): Promise<Config> {
  const res = await fetch(url, { timeout })
  if (res.status === 404) {
    throw new Error(`Not a valid Speed Kit URL: ${url}`)
  }

  const serializer = new Serializer()
  const { config } = serializer.deserialize(await res.text(), DataType.JSON)
  if (!config) {
    throw new Error('No Speed Kit config found')
  }

  return config
}

export async function analyzeSpeedKit(urlToTest: string, db: baqend): Promise<Config> {
  const url = {
    protocol: 'http',
    host: ORIGIN,
    pathname: '/config',
    search: `url=${encodeURIComponent(urlToTest)}`,
  }

  const urlString = URL.format(url)
  db.log.info(`Analyzing Speed Kit Website via ${urlString}`)

  const start = Date.now()
  try {
    return fetchConfig(urlString, 6000)
  } catch (err) {
    throw new Error(`Fetching config from URL failed after ${Date.now() - start}ms: ${err.message}`)
  }
}
