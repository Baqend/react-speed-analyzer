#!/usr/bin/env ts-node
import yargs = require('yargs')
import { server } from './server'

const { port = 8080 } = yargs
  .option('port', {
    alias: 'p',
  })
  .argv


server(port)
