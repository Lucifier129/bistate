import { useMemo, useState, useLayoutEffect } from 'react'
import { Bistate } from '../createBistate'
import createStore from '../createStore'
import { isFunction } from '../util'

export default function useBistate<T extends object>(initialState: T | (() => T)): Bistate<T> {
  let store = useMemo(() => {
    if (isFunction(initialState)) {
      initialState = (initialState as () => T)()
    }
    return createStore(initialState as T)
  }, [])

  let [state, setState] = useState(store.getState())

  useLayoutEffect(() => store.subscribe(setState), [store])

  return state
}
