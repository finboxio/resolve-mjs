import { strict as assert } from 'assert'

import esm from 'test-import'
import cjs from 'test-require'
import all, { sub } from 'test-named-require'
import * as star from 'test-star-require'
import js from 'test-type'
import json from 'test-json'

assert.ok(esm())
assert.ok(cjs())
assert.ok(cjs.sub())
assert.ok(sub())
assert.ok(all())
assert.ok(all.sub())
assert.ok(star.default())
assert.ok(star.default.sub())
assert.ok(star.sub())
assert.ok(js())
assert.ok(json.test)
