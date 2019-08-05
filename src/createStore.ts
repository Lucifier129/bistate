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

type Record = {
  status: boolean
  store: any
}

const createObjectRecord = object => {
  let record = {} as Record

  for (let key in object) {
    let value = object[key]
    record[key] = {
      status: !isArray(value) && !isObject(value),
      value: value
    }
  }

  return record
}

const createObjectBistate = object => {
  let record = createObjectRecord(object)

  let patches = {}

  let getValue = key => {
    if (!record.hasOwnProperty(key)) return target[key]

    if (record[key].status) return record[key].value

    let value = createBistate(object[key])

    target[key] = record[key].value = value

    return value
  }

  let uid = 0

  let isDirty = false
  let notify = () => {
    isDirty = true

    if (parent) {
      parent[BISTATE].notify()
    } else {
      Promise.resolve(++uid).then(next)
    }
  }

  let next = n => {
    if (n !== uid) return

    if (keys.length === 0) return

    patches = {}
  }

  let handlers = {
    get: (target, key, receiver) => {
      return getValue(key)
    },
    set: (target, key, value, receiver) => {
      let oldValue = target[key]

      if (!patches.hasOwnProperty(key)) {
        patches[key] = {
          type: '',
          oldValue: oldValue,
          value: null
        }
      }

      if (isArray(value) || isObject(value)) {
        if (!isBistate(value)) {
          value = createBistate(value)
        }
        value[BISTATE].setParent(state)
      }

      if (isBistate(oldValue)) {
        oldValue[BISTATE].deleteParent()
      }

      target[key] = value

      let patch = patches[key]

      if (patch.oldValue === value) {
        patch.type = 'equal'
      } else if (object.hasOwnProperty(key)) {
        patch.type = 'replace'
        patch.value = value
      } else {
        patch.type = 'add'
        patch.value = value
      }

      notify()

      return true
    },
    defineProperty: (target, key, receiver) => {
      let value = target[key]

      if (object.hasOwnProperty(key)) {
        patches[key] = {
          type: 'delete',
          value: value
        }
      } else if (patches.hasOwnProperty(key)) {
        delete patches[key]
      }

      notify()

      return true
    }
  }

  let target = { ...object }

  let state = new Proxy(target, handlers)

  let listener = null
  let subscribe = f => {
    listener = f
    return () => {
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

  Object.defineProperty(state, BISTATE, {
    value: { subscribe, setParent, deleteParent, notify, next },
    enumerable: false,
    writable: false
  })

  return state
}

const createArrayBistate = array => {}

export const createBistate = initialState => {
  if (isArray(initialState)) {
    return createArrayBistate(initialState)
  } else if (isObject(initialState)) {
    return createObjectBistate(initialState)
  }
  throw new Error(`Unexpected argument ${initialState}`)
}
