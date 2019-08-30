import { useMemo, useState, useLayoutEffect } from 'react'
import { isBistate } from '../createBistate'
import createStore from '../createStore'
import { isFunction } from '../util'

export default function useBistate(initialState, currentState) {
  let store = useMemo(() => {
    if (isFunction(initialState)) {
      initialState = initialState()
    }
    return createStore(initialState)
  }, [])

  let [state, setState] = useState(store.getState())

  useLayoutEffect(() => store.subscribe(setState), [store])

  return isBistate(currentState) ? currentState : state
}
