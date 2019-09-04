import { useMemo } from 'react'
import { Bistate, isBistate, lock, unlock } from '../createBistate'
import createStore from '../createStore'
import { isFunction } from '../util'
import useUpdate from './useUpdate'

export default function useBistate<T extends object>(
  initialState: T | (() => T),
  currentState?: Bistate<T>
): Bistate<T> {
  let store = useMemo(() => {
    if (isFunction(initialState)) {
      initialState = (initialState as () => T)()
    }
    return createStore(initialState as T)
  }, [])

  let update = useUpdate()

  // commit change to get next state if state has been mutated
  unlock(store.getState())

  let state = store.getState()

  // lock state, and trigger update when mutate state
  lock(state, update)

  return isBistate(currentState) ? currentState : state
}
