import { useMemo, useCallback, useState, useEffect } from 'react'
import createStore from '../createStore'
import { mutate } from '../createBistate'
import { isFunction, merge } from '../util'

export default function useBistate(initialState) {
  let store = useMemo(() => {
    if (isFunction(initialState)) {
      initialState = initialState()
    }
    return createStore(initialState)
  }, [])

  let [state, setState] = useState(store.getState())

  let updateState = useCallback(
    nextState => {
      let currentState = store.getState()

      if (isFunction(nextState)) {
        mutate(() => nextState(currentState))
      } else {
        mutate(() => merge(currentState, nextState))
      }
    },
    [store]
  )

  useEffect(() => store.subscribe(setState), [store])

  return [state, updateState]
}
