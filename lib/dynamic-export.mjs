import Module from 'module'
import Path from 'path'

import ExportProxy from './export-proxy'

export default (path, code) => {
  const module = new Module(path)

  module.filename = path
  module.paths = Module._nodeModulePaths(Path.dirname(path))
  module.require = Module.createRequire(path)
  module._compile(code, path)
  module.loaded = true

  return {
    exports: [ 'default', ...Object.keys(module.exports) ],
    execute (exports) {
      exports.default.set(new ExportProxy(module))
      Object.keys(module.exports).forEach((key) => {
        exports[key].set(new ExportProxy(module, key))
      })
    }
  }
}
