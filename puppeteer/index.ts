#!/usr/bin/env ts-node
import yargs = require('yargs')
import { resolve } from 'path'
import { readJSON } from './io'
import { server } from './server'

async function main() {
  const { version } = await readJSON(resolve(__dirname, 'package.json'))
  process.stderr.write(`Puppeteer Server ${version}`)

  const { buildDate = null } = await readJSON(resolve(__dirname, 'build.json'))
  if (buildDate) {
    process.stderr.write(`, build at ${buildDate}`)
  }
  process.stderr.write(`\n`)

  const { port = 8080, caching = false, userDataDir = null, noSandbox = false } = yargs
    .option('port', {
      type: 'number',
      alias: 'p',
      desc: 'The port to run on',
    })
    .option('caching', {
      type: 'boolean',
      alias: 'c',
      desc: 'Enables browser caching',
    })
    .option('user-data-dir', {
      type: 'string',
      alias: 'u',
      desc: 'Specify chrome user data directory',
    })
    .option('no-sandbox', {
      type: 'boolean',
      alias: 'x',
      desc: 'Run chrome in no-sandbox mode',
    })

    .alias('h', 'help')
    .alias('v', 'version')

    .argv

  await server(port, { caching, userDataDir, noSandbox })
}

main().catch((e) => {
  process.stderr.write(e.stack)
  process.exit(1)
})


