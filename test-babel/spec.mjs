import { strict as assert } from 'assert'

import esm from 'test-import'
import cjs from 'test-require'
import js from 'test-type'
import json from 'test-json'

import circular_mjs from 'test-circular-mjs'
import circular_cjs from 'test-circular-cjs'

import error_mjs from 'test-error-mjs'
import error_cjs from 'test-error-cjs'

// Just to test imports from node modules
import eslint from 'eslint'

assert.ok(esm())
assert.ok(cjs())
assert.ok(js())
assert.ok(json.test)
assert.ok(eslint)

assert.ok(circular_mjs())
assert.ok(circular_cjs())

let mjs_err
try {
  error_mjs()
} catch (e) {
  mjs_err = e
}
assert.ok(mjs_err.stack.includes('test-error-mjs.mjs'))

let cjs_err
try {
  error_cjs()
} catch (e) {
  cjs_err = e
}
assert.ok(cjs_err.stack.includes('test-error-cjs.cjs'))

console.log('done')
