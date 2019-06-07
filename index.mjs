import Module from 'module'
import Path from 'path'
import fs from 'fs'
import pkg from 'find-package-json'

const EXTENSIONS = {
  '.cjs': 'commonjs',
  '.mjs': 'module',
  '.es': 'module',
  '.es6': 'module',
  '.node': 'addon',
  '.json': 'json',
  '.wasm': 'wasm'
}

export async function resolve (specifier, parent, system) {
  try {
    // Let the default resolve algorithm try first
    let { url, format } = system(specifier, parent)

    // Resolve symlinks
    if (url.startsWith('file://')) {
      const realpath = await fs.promises.realpath(url.replace('file://', ''))
      url = `file://${realpath}`
    }

    return { url, format }
  } catch (error) {
    const base = parent ? Path.dirname(parent.replace('file://', '')) : process.cwd()
    const require = Module.createRequireFromPath(Path.join(base, specifier))

    let path
    try {
      path = require.resolve(specifier)
    } catch (e) {
      // .cjs is apparently not part of the default resolution algorithm,
      // so check if .cjs file exists before bailing completely
      path = require.resolve(`${specifier}.cjs`)
    }

    const ext = Path.extname(path)

    let format = EXTENSIONS[ext] || 'module'

    // Mimic default behavior of treating .js[x]? as ESM iff
    // relevant package.json contains { "type": "module" }
    if (!ext || [ '.js', '.jsx' ].includes(ext)) {
      const dir = Path.dirname(path)
      const pkgdef = pkg(dir).next()
      const type = pkgdef && pkgdef.value && pkgdef.value.type
      format = type === 'module' ? 'module' : 'commonjs'
    }

    path = await fs.promises.realpath(path)

    return { url: `file://${path}`, format }
  }
}
