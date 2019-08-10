import { isFunction, isThenable, isArray, isObject } from './util'

const BISTATE = Symbol('BISTATE')

export const isBistate = input => !!(input && input[BISTATE])

const getBistateValue = (value, currentProxy, previousProxy) => {
  if (previousProxy && isBistate(value)) {
    let parent = value[BISTATE].getParent()

    // reuse bistate
    if (parent === previousProxy) {
      value = value[BISTATE].compute()
    } else {
      value = createBistate(value)
    }
  } else if (isArray(value) || isObject(value)) {
    value = createBistate(value)
  }

  if (isBistate(value)) {
    value[BISTATE].setParent(currentProxy)
  }

  return value
}

const fillObjectBistate = (currentProxy, initialObject, target, scapegoat, previousProxy) => {
  for (let key in initialObject) {
    let value = getBistateValue(initialObject[key], currentProxy, previousProxy)
    scapegoat[key] = value
    target[key] = value
  }
}

const fileArrayBistate = (currentProxy, initialArray, target, scapegoat, previousProxy) => {
  for (let i = 0; i < initialArray.length; i++) {
    let item = getBistateValue(initialArray[i], currentProxy, previousProxy)
    scapegoat[i] = item
    target[i] = item
  }
}

let isMutable = false
let dirtyStateList = []

const release = () => {
  let list = dirtyStateList

  isMutable = false
  dirtyStateList = []

  for (let i = 0; i < list.length; i++) {
    let item = list[i]
    item[BISTATE].trigger()
  }
}

export const mutate = f => {
  if (!isFunction(f)) {
    throw new Error(`Expected f in mutate(f) is a function, but got ${f} `)
  }

  let previousFlag = isMutable

  isMutable = true

  try {
    let result = f()

    if (isThenable(result)) {
      throw new Error(`mutate(f) don't support async function`)
    }
    return result
  } finally {
    if (!previousFlag) release()
  }
}

const createBistate = (initialState, previousProxy = null) => {
  if (!isArray(initialState) && !isObject(initialState)) {
    throw new Error(`Expected initialState to be array or plain object, but got ${initialState}`)
  }

  let scapegoat = isArray(initialState) ? [] : {}
  let target = isArray(initialState) ? [] : {}

  let consuming = false
  let watcher = null
  let watch = f => {
    if (watcher) throw new Error(`bistate can be watched twice`)
    if (!scapegoat) throw new Error(`current state is immutable, can not be watched now`)
    if (parent) throw new Error(`Only root node can be watched`)

    watcher = f

    if (isDirty) {
      trigger()
    } else {
      consuming = true
    }

    return unwatch
  }
  let unwatch = () => {
    consuming = false
    watcher = null
  }

  let parent = null
  let setParent = input => {
    parent = input
  }
  let getParent = () => {
    return parent
  }
  let deleteParent = () => {
    parent = null
  }

  let isDirty = false
  let notify = () => {
    isDirty = true

    if (consuming && !dirtyStateList.includes(currentProxy)) {
      dirtyStateList.push(currentProxy)
    }

    if (parent) {
      parent[BISTATE].notify()
    }
  }

  let trigger = () => {
    if (!watcher) return

    let f = watcher
    let nextProxy = compute()

    if (nextProxy !== currentProxy) {
      f(nextProxy)
    }
  }

  let compute = () => {
    if (!isDirty) return currentProxy

    isDirty = false

    /**
     * redo
     * create nextProxy based on scapegoat and target
     * reuse unchanged value as possible
     */
    let nextProxy = createBistate(scapegoat, currentProxy)
    /**
     * undo
     * clear scapegoat to keep currentProxy as immutable
     */
    scapegoat = null
    deleteParent()
    unwatch()
    return nextProxy
  }

  let internal = { watch, setParent, getParent, deleteParent, notify, compute, trigger }

  let handlers = {
    get: (target, key) => {
      if (key === BISTATE) return internal

      if (isMutable && scapegoat) {
        return Reflect.get(scapegoat, key)
      } else {
        return Reflect.get(target, key)
      }
    },
    set: (_, key, value) => {
      if (isMutable && scapegoat) {
        let result = Reflect.set(scapegoat, key, value)
        notify()
        return result
      } else {
        throw new Error(`state is immutable, it's not allow to set property ${key}`)
      }
    },
    deleteProperty: (_, key) => {
      if (isMutable && scapegoat) {
        let result = Reflect.deleteProperty(scapegoat, key)
        notify()
        return result
      } else {
        throw new Error(`state is immutable, it's not allow to delete property ${key}`)
      }
    },
    has: (target, key) => {
      if (isMutable && scapegoat) {
        return Reflect.has(scapegoat, key)
      } else {
        return Reflect.has(target, key)
      }
    },
    ownKeys: target => {
      if (isMutable && scapegoat) {
        return Reflect.ownKeys(scapegoat)
      } else {
        return Reflect.ownKeys(target)
      }
    }
  }

  let currentProxy = new Proxy(target, handlers)

  if (isArray(currentProxy)) {
    fileArrayBistate(currentProxy, initialState, target, scapegoat, previousProxy)
  } else {
    fillObjectBistate(currentProxy, initialState, target, scapegoat, previousProxy)
  }

  // clear previousProxy
  previousProxy = null
  // clear initialState
  initialState = null

  return currentProxy
}

export default function(initialState) {
  return createBistate(initialState, null)
}

export const watch = (state, watcher) => {
  if (!isBistate(state)) {
    throw new Error(`Expected state to be a bistate, but received ${state}`)
  }

  if (!isFunction(watcher)) {
    throw new Error(`Expected watcher to be a function, but received ${watcher}`)
  }

  return state[BISTATE].watch(watcher)
}

export const remove = state => {
  if (!isBistate(state)) {
    throw new Error(`Expected state to be a bistate, but received ${state}`)
  }

  let parent = state[BISTATE].getParent()

  if (!parent) return

  if (isArray(parent)) {
    let index = parent.indexOf(state)
    parent.splice(index, 1)
    return
  }

  if (isObject(parent)) {
    for (let key in parent) {
      let value = parent[key]
      if (value === state) {
        delete parent[key]
        return
      }
    }
  }
}
