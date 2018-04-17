#!/usr/bin/env ts-node
import yargs = require('yargs')
import { server } from './server'

const { port = 8080, caching = false, timings = false, userDataDir = null } = yargs
  .option('port', {
    alias: 'p',
  })
  .option('caching', {
    alias: 'c',
  })
  .option('user-data-dir', {
    alias: 'u',
  })
  .option('timings', {
    alias: 'T',
  })
  .argv


server(port, { caching, timings, userDataDir })
