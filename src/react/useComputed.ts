import { useMemo } from 'react'
import useStaticFunction from './useStaticFunction'
import createBistate, { lock, mutate } from '../createBistate'

export default function useComputed<S extends object>(state: S, deps?: any[]) {
  let setter = useStaticFunction((key, value) => {
    let descriptor = Object.getOwnPropertyDescriptor(state, key)
    if (descriptor.set) {
      descriptor.set(value)
    } else {
      state[key] = value
    }
  })

  let computed = useMemo(() => {
    let descriptors = Object.getOwnPropertyDescriptors(state)

    for (let key in descriptors) {
      let descriptor = descriptors[key]
      if (descriptor.set) {
        descriptor.set = value => setter(key, value)
      }
    }

    return Object.defineProperties({}, descriptors) as S
  }, deps)

  return computed
}

/**
 * useComputedFunction can support deeply change-detection
 * but for now it may cause a performance problem
 * since createBistate can not reuse other bistate, and always deep copy state.
 * TODO: reusing bistate from initialState?
 * TODO: or make createBistate supports lazy initialization?
 */
// export const useComputedFunction = <
//   Get extends () => object,
//   Set extends (state: ReturnType<Get>) => any
// >(
//   get: Get,
//   set: Set,
//   deps?: any[]
// ) => {
//   let setter = useStaticFunction(set)

//   let computed = useMemo(() => {
//     let state = createBistate(get()) as ReturnType<Get>

//     lock(state, () => {
//       mutate(() => {
//         setter(state)
//       })
//     })

//     return state
//   }, deps)

//   return computed
// }
