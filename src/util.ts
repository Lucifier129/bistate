export const isArray = Array.isArray

export const isFunction = (input: any) => typeof input === 'function'

export const isObject = (input: any) => {
  if (typeof input !== 'object' || input === null) return false

  let proto = input
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(input) === proto
}

export const isThenable = input => !!(input && typeof input.then === 'function')

export const merge = <T = any>(target: object | Array<T>, source: object | Array<T>) => {
  if (isArray(source) && isArray(target)) {
    source.forEach((value, index) => {
      target[index] = value
    })
  } else if (isObject(source) && isObject(target)) {
    Object.assign(target, source)
  } else {
    throw new Error(`Failed to merge, target and source is not the same type of array or object`)
  }
  return target
}

interface Deferred<T = any> {
  promise: Promise<T>
  resolve: (value?: T) => void
  reject: (reason?: any) => void
}

const noop = () => {}

export const createDeferred = <T>(): Deferred<T> => {
  let resolve: Deferred<T>['resolve'] = noop
  let reject: Deferred<T>['reject'] = noop
  let promise: Promise<T> = new Promise((a, b) => {
    resolve = a
    reject = b
  })
  return { resolve, reject, promise }
}
