import { isFunction, isArray, isObject, merge, createDeferred } from './util'

type Source = any[] | object

type Watcher<T> = (state: T) => void
type Unwatch = () => void

type createBistate<T extends Source> = {
  getState: () => T
  watch: (watcher: Watcher<T>) => Unwatch
}

const BISTATE = Symbol('BISTATE')
const isBistate = input => !!(input && input[BISTATE])

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

let isBatchMode = false
let pendingBistateList = []
export const batch = f => {
  if (!isFunction(f)) {
    throw new Error(`Expected f in batch(f) is a function, but got ${f} `)
  }

  let previousFlag = isBatchMode

  isBatchMode = true

  f()

  if (previousFlag) return

  let list = pendingBistateList
  pendingBistateList = []

  for (let i = 0; i < list.length; i++) {
    let item = list[i]
    item[BISTATE].trigger()
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
    watcher = f
    consuming = true
    return () => {
      consuming = false
      watcher = null
    }
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

  let uid = 0
  let isDirty = false
  let notify = () => {
    isDirty = true

    if (consuming) {
      if (isBatchMode) {
        if (!pendingBistateList.includes(currentProxy)) {
          pendingBistateList.push(currentProxy)
        }
      } else {
        // tslint:disable-next-line: no-floating-promises
        Promise.resolve(++uid).then(debounceTrigger)
      }
    }

    if (parent) {
      parent[BISTATE].notify()
    }
  }

  let debounceTrigger = n => {
    // debounce check
    if (n !== uid) return
    trigger()
  }

  let trigger = () => {
    if (watcher) {
      let nextProxy = compute()
      if (nextProxy !== currentProxy) {
        watcher(nextProxy)
      }
    }
  }

  let compute = () => {
    if (!isDirty) return currentProxy
    /**
     * redo
     * create nextProxy based on scapegoat and currentProxy
     * reuse unchanged value as possible
     */
    let nextProxy = createBistate(scapegoat, currentProxy)
    /**
     * undo
     * clear scapegoat to keep currentProxy as immutable
     */
    scapegoat = null
    deleteParent()
    return nextProxy
  }

  let internal = { watch, setParent, getParent, deleteParent, notify, compute, trigger }

  let handlers = {
    get: (target, key) => {
      if (key === BISTATE) return internal

      if (scapegoat) {
        return Reflect.get(scapegoat, key)
      } else {
        return Reflect.get(target, key)
      }
    },
    set: (_, key, value) => {
      if (scapegoat) {
        let result = Reflect.set(scapegoat, key, value)
        notify()
        return result
      } else {
        throw new Error(`state is immutable, it's not allow to set property ${key}`)
      }
    },
    deleteProperty: (_, key) => {
      if (scapegoat) {
        let result = Reflect.deleteProperty(scapegoat, key)
        notify()
        return result
      } else {
        throw new Error(`state is immutable, it's not allow to delete property ${key}`)
      }
    },
    has: (target, key) => {
      if (scapegoat) {
        return Reflect.has(scapegoat, key)
      } else {
        return Reflect.has(target, key)
      }
    },
    ownKeys: target => {
      if (scapegoat) {
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

// inline test for dev
let test = createBistate([{ value: 1 }, { value: 2 }, { value: 3 }])

let counter = createBistate({ value: 0 })

watch(test, state => {
  console.log('state', state, test)
  debugger
})

watch(counter, state => {
  console.log('state', state, counter)
  debugger
})

batch(() => {
  test.sort((a, b) => Math.random() - 0.5)
  counter.value += 1
})

setInterval(() => {}, 1000)

// test[0].value += 1
