import { Bistate } from '../createBistate'
import useComputed from './useComputed'

type BindingState<S extends Bistate> = {
  [key in keyof S]: Bistate<{
    value: S[key]
  }>
}

const binding = (state, key) => useComputed(() => state[key], value => (state[key] = value))

const handlers = { get: binding }

export default function useBinding<S extends Bistate>(state: S): BindingState<S> {
  return new Proxy(state, handlers)
}
