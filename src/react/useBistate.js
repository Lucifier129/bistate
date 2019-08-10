import { useMemo, useState, useLayoutEffect } from 'react'
import createStore from '../createStore'
import { isFunction } from '../util'

export default function useBistate(initialState) {
  let store = useMemo(() => {
    if (isFunction(initialState)) {
      initialState = initialState()
    }
    return createStore(initialState)
  }, [])

  let [state, setState] = useState(store.getState())

  useLayoutEffect(() => store.subscribe(setState), [store])

  return state
}
