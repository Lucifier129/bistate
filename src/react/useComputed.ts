import { useMemo } from 'react'
import useStaticFunction from './useStaticFunction'
import createBistate, { mixing, mutate, watch, lock, isBistate } from '../createBistate'

export default function useComputed<
  Get extends () => any,
  Set extends (state: ReturnType<Get>) => any
>({ get, set }: { get: Get; set: Set }, deps?: any[]) {
  if (typeof get !== 'function') {
    throw new Error(`Expected 'get' to be a function ,but got ${get}`)
  }

  if (typeof set !== 'function') {
    throw new Error(`Expected 'set' to be a function ,but got ${set}`)
  }

  let computed = useMemo(() => {
    // use mix mode
    // should not recreate bistate from the state tree returned by get()
    let state = mixing(() => createBistate(get()) as ReturnType<Get>)

    return state
  }, deps)

  lock(computed, () => {
    mutate(() => set(computed))
  })

  return computed
}
