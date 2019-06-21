import register from '@babel/register'

import { resolve as fallback } from './index.mjs'
import DynamicExport from './lib/dynamic-export.mjs'

import fs from 'fs'
import Path from 'path'
import crypto from 'crypto'
import { promisify } from 'util'
import escapeRegExp from 'lodash.escaperegexp'

import Fifo from 'mkfifo'
import babel from '@babel/core'
import SourceMaps from 'source-map-support'

const mkfifo = promisify(Fifo.mkfifo)
const { OptionManager, DEFAULT_EXTENSIONS } = babel

const cwd = Path.resolve('.')
const extensions = [ ...DEFAULT_EXTENSIONS, '.cjs' ]
const only = [
  // Only compile things inside the current working directory.
  new RegExp('^' + escapeRegExp(cwd), 'i')
]
const ignore = [
  // Ignore any node_modules inside the current working directory.
  new RegExp(
    '^' +
      escapeRegExp(cwd) +
      '(?:' +
      Path.sep +
      '.*)?' +
      escapeRegExp(Path.sep + 'node_modules' + Path.sep),
    'i'
  )
]

// Install require hooks for any cjs modules
// loaded via the cjs loader.
register({ extensions, only, ignore })

// Install Source Maps for transpiled files
const SOURCE_MAPS = {}
SourceMaps.install({
  handleUncaughtExceptions: true,
  environment: 'node',
  retrieveSourceMap: (source) => {
    const file = SOURCE_MAPS[source]
    if (!file) return null

    const url = file.path
    const map = file.map
    if (!map) return null

    return { url, map }
  }
})

export async function resolve (specifier, parent, system) {
  // Get the absolute path to the parent
  if (SOURCE_MAPS[parent]) parent = `file://${SOURCE_MAPS[parent].path}`

  // Let main resolver try first
  const { url, format } = await fallback(specifier, parent, system)

  if ([ 'module', 'commonjs' ].includes(format)) {
    const path = url.replace('file://', '')
    return babelResolve(path, format).catch(console.error)
  } else {
    return { url, format }
  }
}

export async function dynamicInstantiate (url) {
  const path = url.replace('file://', '')
  const opts = shouldTranspile(path)
  const realpath = await fs.promises.realpath(path)
  const transpiled = await transpile(realpath, opts)
  SOURCE_MAPS[path] = { path, map: transpiled.map }
  return DynamicExport(realpath, transpiled.code)
}

const FIFO = {}
const babelResolve = async (path, format) => {
  const opts = shouldTranspile(path)
  const realpath = await fs.promises.realpath(path)

  if (format === 'commonjs') {
    return { url: `file://${realpath}`, format: 'dynamic' }
  } else if (!opts) {
    return { url: `file://${realpath}`, format }
  } else {
    FIFO[realpath] = FIFO[realpath] || compileESM(realpath, opts)
    const url = await FIFO[realpath]
    return { url, format }
  }
}

const shouldTranspile = (path) => {
  const opts = new OptionManager().init({
    cwd,
    only,
    ignore,
    sourceRoot: Path.dirname(path),
    filename: path
  })

  if (extensions.includes(Path.extname(path))) {
    return opts
  }
}

const compileESM = async (path, opts) => {
  const transpiled = await transpile(path, opts)

  const uid = crypto.createHash('sha256').update(path, 'utf8').digest('hex')
  const fifoname = `/tmp/${uid}`
  const url = `file://${fifoname}`
  SOURCE_MAPS[url] = { path, map: transpiled.map }

  // Set up a named pipe to serve the transpiled file
  // without actually writing to the filesystem
  await fs.promises.unlink(fifoname).catch((e) => {})
  await mkfifo(fifoname, 0o644)
  fs.promises.open(fifoname, 'w').then(async (fifo) => {
    await fs.promises.writeFile(fifo, transpiled.code)
    await fifo.close()
    await fs.promises.unlink(fifoname).catch((e) => {})
  }).catch((e) => {
    console.error(`Failed to send transpiled module ${path} with ${e.name}:`, e)
    process.exit(1)
  })

  return url
}

const transpile = async (path, opts) => {
  if (opts) {
    const transpiled = await babel.transformFileAsync(path, {
      ...opts,
      caller: { name: 'resolve-mjs', supportsStaticESM: true },
      filename: path,
      sourceMaps: true
    })
    return transpiled
  } else {
    const source = await fs.promises.readFile(path)
    return { code: source.toString() }
  }
}
