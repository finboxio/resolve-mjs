import register from '@babel/register'

import { resolve as fallback } from './index.mjs'

import fs from 'fs'
import Path from 'path'
import crypto from 'crypto'
import Module from 'module'
import { promisify } from 'util'
import escapeRegExp from 'lodash.escaperegexp'

import Fifo from 'mkfifo'
import babel from '@babel/core'
import SourceMaps from 'source-map-support'

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

// Install require hooks for any cjs modules loaded
// via the cjs loader.
register({ extensions, only, ignore })

const FILE_MAP = {}
const TRANSFORM_MAP = {}

SourceMaps.install({
  handleUncaughtExceptions: true,
  environment: 'node',
  retrieveSourceMap: (source) => {
    const file = FILE_MAP[source]
    if (!file) return null

    const url = FILE_MAP[source].path
    const map = FILE_MAP[source].map
    return { url, map }
  }
})

const mkfifo = promisify(Fifo.mkfifo)
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

const transpiler = async (path, opts, format) => {
  if (format === 'commonjs') {
    return { url: `file://${path}`, format: 'dynamic' }
  }

  const url = await compileESM(path, opts, format)

  return { url, format }
}

const compileESM = async (path, opts, format) => {
  const uid = crypto.createHash('sha256').update(path, 'utf8').digest('hex')
  const fifoname = `/tmp/${uid}`
  const url = `file://${fifoname}`

  if (!TRANSFORM_MAP[path]) {
    TRANSFORM_MAP[path] = fifoname
    const transformed = await babel.transformFileAsync(path, {
      ...opts,
      caller: { name: 'resolve-mjs', supportsStaticESM: true },
      filename: path,
      sourceMaps: true
    })

    FILE_MAP[url] = { path, map: transformed.map, format }

    // Set up a named pipe to serve the transpiled file
    // without actually writing to the filesystem
    await fs.promises.unlink(fifoname).catch((e) => {})
    await mkfifo(fifoname, 0o644)
    fs.promises.open(fifoname, 'w').then(async (fifo) => {
      await fs.promises.writeFile(fifo, transformed.code)
      await fifo.close()
      await fs.promises.unlink(fifoname).catch((e) => {})
    }).catch((e) => {
      console.error(`Failed to send transpiled module ${path} with ${e.name}:`, e)
      process.exit(1)
    })
  }

  return url
}

const compileCJS = (path, opts) => {
  const module = new Module(path)

  module.filename = path
  module.paths = Module._nodeModulePaths(Path.dirname(path))
  module.require = Module.createRequire(path)

  const transformed = babel.transformFileSync(path, {
    ...opts,
    caller: { name: 'resolve-mjs', supportsStaticESM: true },
    filename: path,
    sourceMaps: true
  })

  FILE_MAP[path] = { path, map: transformed.map }

  module._compile(transformed.code, path)
  module.loaded = true

  return module
}

export async function resolve (specifier, parent, system) {
  const { url, format } = await fallback(specifier, parent, system)

  const path = url.replace('file://', '')
  const opts = [ 'module', 'commonjs' ].includes(format) && shouldTranspile(path)
  if (opts) {
    return transpiler(path, opts, format)
  }

  return { url, format }
}

export async function dynamicInstantiate (url) {
  const path = url.replace('file://', '')
  const module = compileCJS(path, shouldTranspile(path))
  return {
    exports: [ 'default', ...Object.keys(module.exports) ],
    execute (exports) {
      exports.default.set(module.exports)
      Object.keys(module.exports).forEach((exp) => exports[exp].set(module.exports[exp]))
    }
  }
}
