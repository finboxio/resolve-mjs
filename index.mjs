import Module from 'module'
import Path from 'path'

const BUILTINS = Module.builtinModules
const EXTENSIONS = {
  '.js': 'cjs',
  '.mjs': 'esm',
  '.node': 'addon',
  '.json': 'json'
}

export async function resolve (specifier, parent, system) {
  if (BUILTINS.includes(specifier)) {
    return { url: specifier, format: 'builtin' }
  }
  try {
    return system(specifier, parent)
  } catch (error) {
    const require = Module.createRequireFromPath(Path.join(process.cwd()))
    const path = require.resolve(specifier)
    const ext = Path.extname(path)
    return { url: `file://${path}`, format: EXTENSIONS[ext] || 'esm' }
  }
}
