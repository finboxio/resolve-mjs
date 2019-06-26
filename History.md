
2.2.2 / 2019-06-26
==================

  * Fix invariant violation in some ExportProxy cases

2.2.1 / 2019-06-24
==================

  * Throttle piped imports to resolve issue with fs hanging

2.2.0 / 2019-06-20
==================

  * Fix race condition creating fifo streams
  * Support direct non-default imports from all commonjs files (e.g. `import { x } from 'module'` is allowed where `module.exports.x = y`)
  * Cleanup & refactor

2.1.3 / 2019-06-07
==================

  * code cleanup

2.1.2 / 2019-06-07
==================

  * Fix issue with symlinks and relative imports

2.1.1 / 2019-06-07
==================

  * Update packages

2.1.0 / 2019-06-07
==================

  * Support `type` field in package.json
  * Support for .cjs,.es,.es6,.jsx extension
  * Support live babel transpilation

1.0.0 / 2019-04-13
==================

  * Rename to resolve-mjs
  * Update gitignore & add license
  * Update History.md
  * Update husky config
  * Add changelog
  * Initial commit

