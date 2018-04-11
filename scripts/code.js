#!/usr/bin/env node
const { spawn } = require('child_process')
const { resolve } = require('path')
const which = require('which')

function getAppForMode(mode) {
  switch (mode) {
    case 'development': return 'makefast-dev'
    case 'staging': return 'makefast-staging'
    case 'production': return 'makefast'
    default: throw new Error(`Invalid mode specified: ${mode}`)
  }
}

function getApp() {
  let mode = 'development'
  for (const arg of process.argv) {
    if (arg.startsWith('--mode=')) {
      mode = arg.substr(7)
    }
  }

  return getAppForMode(mode)
}


const app = getApp()

const codeDir = resolve(__dirname, '..', 'baqend')
const outDir = resolve(codeDir, 'out')
const tsc = which.sync('tsc')
const baqend = which.sync('baqend')

const compile = spawn(tsc, ['--project', codeDir])
compile.stdout.pipe(process.stdout)
compile.stderr.pipe(process.stderr)

compile.on('close', (code) => {
  console.log(`TypeScript exited with status code ${code}`)
  if (code === 0 || code === 2) {
    const deploy = spawn(baqend, ['deploy', '--code', '--code-dir', outDir, app])
    deploy.stdout.pipe(process.stdout)
    deploy.stderr.pipe(process.stderr)

    deploy.on('close', (code) => {
      console.log(`Baqend Deploy exited with status code ${code}`)
    })
  }
})
