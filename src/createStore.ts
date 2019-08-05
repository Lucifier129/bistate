import { isFunction, isArray, isObject, merge, createDeferred } from './util'

type Source = any[] | object

type Listener<T> = (state: T) => void
type Unlisten = () => void

type CreateStore<T extends Source> = {
  getState: () => T
  subscribe: (listener: Listener<T>) => Unlisten
}

const BISTATE = Symbol('BISTATE')

const createObjectStore = object => {
  let handlers = {}

  let current = new Proxy(object, handlers)

  let getState = () => {
    return current
  }

  let subscribe = () => {}

  Object.defineProperty(current, BISTATE, {
    value: null,
    enumerable: false,
    writable: false
  })

  return {
    getState,
    subscribe
  }
}

const createArrayStore = array => {}

export const createStore = initialState => {
  if (isArray(initialState)) {
    return createArrayStore(initialState)
  } else if (isObject(initialState)) {
    return createObjectStore(initialState)
  }
  throw new Error(`Unexpected argument ${initialState}`)
}
