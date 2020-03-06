import { baqend, binding } from 'baqend'
import fetch from 'node-fetch'
import { sleep } from './_sleep'

const MAX_DOWNLOAD_RETRIES = 10

interface ResourceInfo {
  buffer: Buffer
  mimeType: string
}

function dataUriToResourceInfo(dataUri: string): ResourceInfo {
  const match = dataUri.match(/^data:(\w+\/\w+);base64,(.*)$/)
  if (!match) {
    throw new Error(`Given data URI was not valid.`)
  }

  const [, mimeType, data] = match
  const buffer = new Buffer(data, 'base64')

  return { buffer, mimeType }
}

async function httpUriToResourceInfo(db: baqend, url: string, maxRetries = MAX_DOWNLOAD_RETRIES): Promise<ResourceInfo> {
  const response = await fetch(url)

  // Retry on error
  if (!response.status || (response.status >= 400 && response.status < 600)) {
    if (maxRetries <= 0) {
      db.log.error(`Downloading video failed with status code: ${response.status}.`)
      throw new Error(`Maximum number of ${MAX_DOWNLOAD_RETRIES} retries reached without success.`)
    }

    await sleep(1000)
    return httpUriToResourceInfo(db, url, maxRetries - 1)
  }

  // Create resource info from HTTP response
  const mimeType = response.headers.get('content-type') || 'application/octet-stream'
  const buffer = await response.buffer()

  return { buffer, mimeType }
}

/**
 * Creates a resource info from a given URI.
 */
async function uriToResourceInfo(db: baqend, uri: string): Promise<ResourceInfo> {
  if (uri.startsWith('data:')) {
    return dataUriToResourceInfo(uri)
  }

  if (uri.startsWith('http:') || uri.startsWith('https:')) {
    return httpUriToResourceInfo(db, uri)
  }

  throw new Error('Cannot handle the given URI\'s protocol.')
}

/**
 * Fetches a URI and saves it to a Baqend file.
 *
 * Usage example:
 * download = require('./download');
 * download.toFile(db, "http://...test.jpg", "/www/image.jpg", 0);
 *
 * @param db Baqend db to use.
 * @param uri The URI that should be saved.
 * @param target the name of the target Baqend file
 * @param maxRetries number of retries if the response has a 4xx or 5xx status code
 * @returns {Promise} a Promise that resolves to the uploaded file
 */
export async function toFile(db: baqend, uri: string, target: string, maxRetries: number = 10): Promise<binding.File> {
  const { buffer: data, mimeType } = await uriToResourceInfo(db, uri)
  const file = new db.File({ path: target })

  return file.upload({ mimeType, type: 'buffer', data, force: true })
}
