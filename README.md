# resolve-mjs

`resolve-mjs` is a Node.js loader module that allows you to use legacy resolve semantics when importing `.mjs` ECMAScript modules.

## Motivation
Newer versions of Node.js offer native support for ECMAScript `import/export` loading semantics. This is fantastic, but the maintainers have decided not to support `NODE_PATH` as part of the resolution algorithm used to locate imported modules (there is most likely a good reason for this, but it is one that I am not aware of).

We use `NODE_PATH` liberally across our organization to keep our `require` references clean, so the fact that it's not supported by `import` has been an impediment to our adoption of native ECMAScript modules. Or at least it was, before we found out you can write [custom loader hooks](https://nodejs.org/api/esm.html#esm_resolve_hook) to resolve imports. Now we can have our local dependencies cake and import it too. 🍰

## Usage
While ECMAScript modules are considered experimental, you'll need to use the `--experimental-modules` flag. Additionally, you must pass the `--loader resolve-mjs` option when running `node`.

### Install It (globally, if you're into that)
`npm install [-g] resolve-mjs`

### Use It
`node --experimental-modules --loader resolve-mjs app/index.js`

> **Protip** If you install `resolve-mjs` globally, you can add `--experimental-modules --loader resolve-mjs` to the `NODE_OPTIONS` environment variable in order to use it without having to add the flags each time you run `node`

## Behavior
`resolve-mjs` should not interfere with any `import` statements that already work with the current `import` implementation - it will first attempt to resolve the import using the default resolver. Only when that fails to return a valid module will it fallback to locating the module with `require` semantics.
