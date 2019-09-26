import { useMemo } from 'react'
import useStaticFunction from './useStaticFunction'

type BindingState<S extends object> = {
  [key in keyof S]: {
    value: S[key]
  }
}

const binding = <S extends object>(state: S, key: keyof S) => {
  let setter = useStaticFunction(value => (state[key] = value))
  return useMemo(() => {
    return {
      get value() {
        return state[key]
      },
      set value(value) {
        setter(value)
      }
    }
  }, [state[key]])
}

const handlers = { get: binding }

export default function useBinding<S extends object>(state: S) {
  return useMemo(() => new Proxy(state, handlers), [state]) as BindingState<S>
}
