#!/usr/bin/env ts-node
import yargs = require('yargs')
import { server } from './server'

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

server(port, { caching, userDataDir, noSandbox })
  .catch((e) => {
    process.stderr.write(e.stack)
    process.exit(1)
  })
