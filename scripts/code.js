#!/usr/bin/env node
const { spawn } = require('child_process')
const { resolve } = require('path')
const which = require('which')
const rimraf = require('rimraf')
const db = require('baqend')

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

function deleteDirectory(dir) {
  return new Promise((resolve) => {
    rimraf(dir, () => {
      console.log(`Deleted directory: ${dir}`)
      resolve()
    })
  })
}

function execute(program, args) {
  return new Promise((resolve) => {
    const proc = spawn(program, args)
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)

    proc.on('close', (code) => {
      resolve(code)
    })
  })
}


async function main() {
  const app = getApp()

  const codeDir = resolve(__dirname, '..', 'baqend')
  const outDir = resolve(codeDir, 'out')
  const tsc = which.sync('tsc')
  const baqend = which.sync('baqend')

  // Delete output directory
  await deleteDirectory(outDir)

  const compile = await execute(tsc, ['--project', codeDir])
  console.log(`TypeScript exited with status code ${compile}`)
  if (compile !== 0) {
    throw new Error(`TypeScript exited with bad status code: ${compile}`)
  }

  const deploy = await execute(baqend, ['deploy', '--code', '--code-dir', outDir, app])
  console.log(`Baqend Deploy exited with status code ${deploy}`)
}

main()
  .catch(console.error)
