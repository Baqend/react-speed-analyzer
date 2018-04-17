#!/usr/bin/env ts-node
import yargs = require('yargs')
import { server } from './server'

const { port = 8080, caching = false, userDataDir = null } = yargs
  .option('port', {
    alias: 'p',
  })
  .option('caching', {
    alias: 'c',
  })
  .option('user-data-dir', {
    alias: 'u',
  })
  .argv


server(port, caching, userDataDir)
