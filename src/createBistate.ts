import { isFunction, isThenable, isArray, isObject } from './util'

/** Object types that should never be mapped */
type AtomicObject =
  | Function
  | Map<any, any>
  | WeakMap<any, any>
  | Set<any>
  | WeakSet<any>
  | Promise<any>
  | Date
  | RegExp
  | Boolean
  | Number
  | String

export type Bistate<T = object> = T extends AtomicObject
  ? T
  : T extends object
  ? { -readonly [K in keyof T]: Bistate<T[K]> }
  : T

const BISTATE = Symbol('BISTATE')

export const isBistate = input => !!(input && input[BISTATE])

const getBistateValue = (value, currentProxy, previousProxy) => {
  let status = ''
  /**
   * if previousProxy exists, it is in reusing phase
   * otherwise is in initializing phase
   */
  if (previousProxy) {
    if (isBistate(value)) {
      let parent = value[BISTATE].getParent()

      // reuse bistate
      if (parent === previousProxy) {
        status = 'reuse'
      } else {
        status = 'create'
      }
    } else if (isArray(value) || isObject(value)) {
      status = 'create'
    }
  } else if (isArray(value) || isObject(value)) {
    status = 'create'
  }

  if (status === 'reuse') {
    value = value[BISTATE].compute()
    value[BISTATE].setParent(currentProxy)
  } else if (status === 'create') {
    value = createBistate(value)
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

const fillArrayBistate = (currentProxy, initialArray, target, scapegoat, previousProxy) => {
  for (let i = 0; i < initialArray.length; i++) {
    let item = getBistateValue(initialArray[i], currentProxy, previousProxy)
    scapegoat[i] = item
    target[i] = item
  }
}

let isMutable = false
let dirtyStateList = []

const commit = () => {
  let list = dirtyStateList

  dirtyStateList = []

  for (let i = 0; i < list.length; i++) {
    let item = list[i]
    item[BISTATE].trigger()
  }
}

export const mutate = <T extends () => any>(f: T): ReturnType<T> => {
  if (!isFunction(f)) {
    throw new Error(`Expected f in mutate(f) is a function, but got ${f} `)
  }

  if (f[Symbol.toStringTag] === 'AsyncFunction') {
    throw new Error(`mutate(f) don't support async function`)
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
    isMutable = previousFlag
    if (!previousFlag) commit()
  }
}

const createBistate = <State extends object>(
  initialState: State,
  previousProxy = null
): Bistate<State> => {
  if (!isArray(initialState) && !isObject(initialState)) {
    throw new Error(`Expected initialState to be array or object, but got ${initialState}`)
  }

  let scapegoat = isArray(initialState) ? [] : {}
  let target = isArray(initialState) ? [] : {}

  let consuming = false
  let watcher = null
  let watch = f => {
    if (watcher) throw new Error(`bistate can not be watched twice`)

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

  let isDebug = false
  let debug = () => {
    isDebug = true
  }
  let undebug = () => {
    isDebug = false
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

  let isLock = false
  let onLock = null
  let lock = f => {
    isLock = true
    onLock = f
  }
  let unlock = () => {
    isLock = false
    onLock = null
    if (isDirty) trigger()
  }
  let trigger = () => {
    if (!watcher || isLock) {
      if (isLock && isFunction(onLock)) {
        onLock()
      }
      return
    }

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
    onLock = null
    deleteParent()
    unwatch()
    return nextProxy
  }

  let internal = {
    watch,
    setParent,
    getParent,
    deleteParent,
    notify,
    compute,
    trigger,
    lock,
    unlock,
    debug,
    undebug
  }

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
        if (isDebug) debugger
        notify()
        return result
      } else {
        throw new Error(`state is immutable, it's not allow to set property ${key}`)
      }
    },
    deleteProperty: (_, key) => {
      if (isMutable && scapegoat) {
        let result = Reflect.deleteProperty(scapegoat, key)
        if (isDebug) debugger
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

  let currentProxy = new Proxy(target, handlers) as Bistate<State>

  if (isArray(currentProxy)) {
    fillArrayBistate(currentProxy, initialState, target, scapegoat, previousProxy)
  } else {
    fillObjectBistate(currentProxy, initialState, target, scapegoat, previousProxy)
  }

  // clear previousProxy
  previousProxy = null
  // clear initialState
  initialState = null

  return currentProxy
}

export default function<State extends object>(initialState: State) {
  return createBistate(initialState, null)
}

type Unwatch = () => void
type Watcher<T> = (state: T) => any

export const watch = <T extends Bistate<any>>(state: T, watcher: Watcher<T>): Unwatch => {
  if (!isBistate(state)) {
    throw new Error(`Expected state to be a bistate, but received ${state}`)
  }

  if (!isFunction(watcher)) {
    throw new Error(`Expected watcher to be a function, but received ${watcher}`)
  }

  return state[BISTATE].watch(watcher)
}

export const lock = <T extends Bistate<any>>(state: T, f?: Function) => {
  if (!isBistate(state)) {
    throw new Error(`Expected state to be a bistate, but received ${state}`)
  }
  state[BISTATE].lock(f)
}

export const unlock = <T extends Bistate<any>>(state: T) => {
  if (!isBistate(state)) {
    throw new Error(`Expected state to be a bistate, but received ${state}`)
  }
  state[BISTATE].unlock()
}

export const debug = <T extends Bistate<any>>(state: T) => {
  if (!isBistate(state)) {
    throw new Error(`Expected state to be a bistate, but received ${state}`)
  }
  state[BISTATE].debug()
}

export const undebug = <T extends Bistate<any>>(state: T) => {
  if (!isBistate(state)) {
    throw new Error(`Expected state to be a bistate, but received ${state}`)
  }
  state[BISTATE].undebug()
}

export const remove = <T extends Bistate<any>>(state: T) => {
  if (!isBistate(state)) {
    throw new Error(`Expected state to be a bistate, but received ${state}`)
  }

  let parent = state[BISTATE].getParent()

  if (!parent) return false

  if (isArray(parent)) {
    let index = parent.indexOf(state)
    parent.splice(index, 1)
    return true
  }

  if (isObject(parent)) {
    for (let key in parent) {
      let value = parent[key]
      if (value === state) {
        delete parent[key]
        return true
      }
    }
  }

  return false
}
