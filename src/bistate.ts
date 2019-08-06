import { isFunction, isArray, isObject, merge, createDeferred } from './util'

type Source = any[] | object

type Listener<T> = (state: T) => void
type Unlisten = () => void

type createBistate<T extends Source> = {
  getState: () => T
  subscribe: (listener: Listener<T>) => Unlisten
}

const BISTATE = Symbol('BISTATE')
const isBistate = input => !!(input && input[BISTATE])

const fillObjectBistate = (proxy, object, target, scapegoat, reuse) => {
  if (reuse) {
    for (let key in object) {
      let value = object[key]

      // reuse current bistate
      if (isBistate(value)) {
        value = value[BISTATE].compute()
        value[BISTATE].setParent(proxy)
      } else if (isArray(value) || isObject(value)) {
        value = createBistate(value, true)
        value[BISTATE].setParent(proxy)
      }

      scapegoat[key] = value
      target[key] = value
    }
  } else {
    for (let key in object) {
      let value = object[key]

      // create bistate directly
      if (isArray(value) || isObject(value)) {
        value = createBistate(value)
        value[BISTATE].setParent(proxy)
      }

      scapegoat[key] = value
      target[key] = value
    }
  }
}

const fileArrayBistate = (proxy, array, target, scapegoat, reuse) => {
  if (reuse) {
    for (let i = 0; i < array.length; i++) {
      let item = array[i]

      // reuse current bistate
      if (isBistate(item)) {
        item = item[BISTATE].compute()
        item[BISTATE].setParent(proxy)
      } else if (isArray(item) || isObject(item)) {
        item = createBistate(item, true)
        item[BISTATE].setParent(proxy)
      }

      scapegoat[i] = item
      target[i] = item
    }
  } else {
    for (let i = 0; i < array.length; i++) {
      let item = array[i]

      // create bistate directly
      if (isArray(item) || isObject(item)) {
        item = createBistate(item)
        item[BISTATE].setParent(proxy)
      }

      scapegoat[i] = item
      target[i] = item
    }
  }
}

const createBistate = (initialState, reuse = false) => {
  let isArrayType = isArray(initialState)
  let isObjectType = isObject(initialState)

  if (!isArrayType && !isObjectType) {
    throw new Error(`Expected initialState to be array or plain object, but got ${initialState}`)
  }

  let uid = 0

  let isDirty = false
  let notify = () => {
    isDirty = true

    if (parent) {
      parent[BISTATE].notify()
    }

    if (consuming) {
      // tslint:disable-next-line: no-floating-promises
      Promise.resolve(++uid).then(next)
    }
  }

  let next = n => {
    if (n !== uid) return
    if (listener) {
      let result = compute()
      if (result !== state) {
        listener(result)
      }
    }
  }

  let compute = () => {
    if (!isDirty) return state
    let result = createBistate(scapegoat, true)
    scapegoat = null
    deleteParent()
    return result
  }

  let scapegoat = isArray(initialState) ? [] : {}
  let target = isArray(initialState) ? [] : {}

  let handlers = {
    get: (target, key) => {
      if (key === BISTATE) return internal
      if (scapegoat) {
        return Reflect.get(scapegoat, key)
      } else {
        return Reflect.get(target, key)
      }
    },
    has: (target, key) => {
      if (scapegoat) {
        return Reflect.has(scapegoat, key)
      } else {
        return Reflect.has(target, key)
      }
    },
    set: (target, key, value) => {
      if (scapegoat) {
        let result = Reflect.set(scapegoat, key, value)
        notify()
        return result
      } else {
        throw new Error(`state is immutable, can not be setted property ${key}`)
      }
    },
    ownKeys: target => {
      if (scapegoat) {
        return Reflect.ownKeys(scapegoat)
      } else {
        return Reflect.ownKeys(target)
      }
    },
    deleteProperty: (target, key) => {
      if (scapegoat) {
        let result = Reflect.deleteProperty(scapegoat, key)
        notify()
        return result
      } else {
        throw new Error(`state is immutable, can not be deleted property ${key}`)
      }
    }
  }

  let state = new Proxy(target, handlers)

  if (isArray(state)) {
    fileArrayBistate(state, initialState, target, scapegoat, reuse)
  } else {
    fillObjectBistate(state, initialState, target, scapegoat, reuse)
  }

  let consuming = false
  let listener = null
  let subscribe = f => {
    if (listener) throw new Error(`bistate can be listened twice`)
    listener = f
    consuming = true
    return () => {
      consuming = false
      listener = null
    }
  }

  let parent = null
  let setParent = input => {
    parent = input
  }
  let deleteParent = () => {
    parent = null
  }

  let internal = { subscribe, setParent, deleteParent, notify, compute }

  return state
}

export default function(initialState) {
  return createBistate(initialState, false)
}

let test = createBistate([{ value: 1 }, { value: 2 }, { value: 3 }])

test[BISTATE].subscribe(state => {
  console.log('state', state, test)
  debugger
})

test.sort((a, b) => Math.random() - 0.5)

setInterval(() => {}, 1000)

// test[0].value += 1
