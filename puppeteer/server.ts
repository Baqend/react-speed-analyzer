import chalk from 'chalk'
import express from 'express'
import morgan from 'morgan'
import { resolve } from 'path'
import puppeteer from 'puppeteer'
import { Analyzer } from './Analyzer'
import { deleteDirectory } from './io'

const screenshotDir = resolve(__dirname, 'public', 'screenshots')
const analyzer = new Analyzer(screenshotDir)

/**
 * Returns the status code for a given error.
 */
function getErrorStatusCode({ message }: Error): number {
  if (message.includes('Navigation Timeout Exceeded')) {
    return 504
  }

  if (message.startsWith('net::ERR_NAME_NOT_RESOLVED')) {
    return 404
  }

  return 500
}

/**
 * Starts the puppeteer server
 */
export async function server(port: number, { caching, userDataDir, noSandbox }: Options) {
  if (caching && !userDataDir) {
    throw new Error('Please provide a userDataDir to enable caching')
  }

  if (userDataDir) {
    await deleteDirectory(userDataDir)
    console.log(`Deleted ${userDataDir}`)
  }

  const args = noSandbox ? ['--no-sandbox'] : []
  const browser = await puppeteer.launch({ args, userDataDir })
  const app = express()

  morgan.token('status', (req, res) => {
    const status = String(res.statusCode)
    if (res.statusCode >= 400) {
      return chalk.bgRed.black(status)
    } else if (res.statusCode >= 300) {
      return chalk.bgYellow.black(status)
    } else {
      return chalk.bgGreen.black(status)
    }
  })

  app.use(morgan(chalk`:remote-addr [:date[clf]] {yellow.bold :method} :status ":url" HTTP/:http-version :response-time`))

  app.use(express.static('public'))

  app.use(async (req, res) => {
    try {
      // Let the analyzer handle the request
      const json = await analyzer.handleRequest(browser, req)
      if (json === null) {
        res.status(404)
        res.json({ error: 'URL does not exist.', status: 404 })
        return
      }

      res.status(200)
      res.json(json)
    } catch (e) {
      const status = getErrorStatusCode(e)
      res.status(status)
      res.json({ message: e.message, status, stack: e.stack })
      process.stderr.write(e.stack)
      process.stderr.write('\n')
    }
  })

  const hostname = '0.0.0.0'
  app.listen(port, () => {
    console.log(`Server is listening on http://${hostname}:${port}/config`)
    console.log(`Caching is ${caching ? `enabled, caching to ${userDataDir}` : 'disabled'}`)
    noSandbox && console.log('Running chrome in no-sandbox mode')
  })

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down')
    await browser.close()
    process.exit()
  })

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down')
    await browser.close()
    process.exit()
  })
}
