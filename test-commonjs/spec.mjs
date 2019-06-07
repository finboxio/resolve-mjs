import { strict as assert } from 'assert'

import esm from 'test-import'
import cjs from 'test-require'
import js from 'test-type'
import json from 'test-json'

assert.ok(esm())
assert.ok(cjs())
assert.ok(js())
assert.ok(json.test)
