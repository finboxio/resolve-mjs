export default class ExportProxy {
  constructor (module, key) {
    const target = function () { return key ? module.exports[key] : module.exports }
    return new Proxy(target, this)
  }

  getPrototypeOf (target) {
    this._export = this._export || target()
    return Object.getPrototypeOf(this._export)
  }

  setPrototypeOf (target) {
    this._export = this._export || target()
    return Object.setPrototypeOf(this._export)
  }

  isExtensible (target) {
    this._export = this._export || target()
    return Reflect.isExtensible(this._export)
  }

  preventExtensions (target) {
    this._export = this._export || target()
    return Object.preventExtensions(this._export)
  }

  getOwnPropertyDescriptor (target, prop) {
    this._export = this._export || target()
    return Object.getOwnPropertyDescriptor(this._export, prop)
  }

  defineProperty (target, key, descriptor) {
    this._export = this._export || target()
    return Object.defineProperty(this._export, key, descriptor)
  }

  has (target, key) {
    this._export = this._export || target()
    return key in this._export
  }

  get (target, key, receiver) {
    this._export = this._export || target()
    return Reflect.get(this._export, key, receiver)
  }

  set (target, key, value) {
    this._export = this._export || target()
    return Reflect.set(this._export, key, value)
  }

  deleteProperty (target, prop) {
    this._export = this._export || target()
    delete this._export[prop]
  }

  ownKeys (target) {
    this._export = this._export || target()
    return Reflect.ownKeys(this._export)
  }

  apply (target, ...args) {
    this._export = this._export || target()
    return this._export.apply(...args)
  }

  construct (target, args) {
    this._export = this._export || target()
    return new this._export(...args)
  }
}
