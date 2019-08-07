import { useRef, useCallback, useLayoutEffect } from 'react'
import useBistate from './useBistate'
import { isFunction } from '../util'

export default function useBireducer(reducer, initialState) {
  let [state, updateState] = useBistate(initialState)
  let reducerRef = useRef(reducer)
  let dispatch = useCallback(action => {
    updateState(currentState => {
      reducerRef.current(currentState, action)
    })
  }, [])

  useLayoutEffect(() => {
    if (!isFunction(reducer)) {
      throw new Error('reducer must be a function')
    }
    reducerRef.current = reducer
  }, [reducer])

  return [state, dispatch]
}
