import { useMemo } from 'react'
import { Bistate } from '../createBistate'
import useStaticFunction from './useStaticFunction'

type Getter = () => any

type Setter = (value: any) => any

type BindingValue<V> = Bistate<{ value: V }>

export default function useComputed<Get extends Getter, Set extends Setter>(
  get: Get | { get: Get; set: Set },
  set?: Set
): BindingValue<ReturnType<Get>> {
  if (typeof get === 'object') {
    set = get.set
    get = get.get
  }

  if (typeof get !== 'function') {
    throw new Error(`Expected first argument to be a function ,but got ${get}`)
  }

  if (typeof set !== 'function') {
    throw new Error(`Expected second argument to be a function ,but got ${set}`)
  }

  // deal the stale closure problem for set
  let setter = useStaticFunction(set)

  let computedState = useMemo(() => {
    return {
      get value() {
        return (get as Get)()
      },
      set value(v) {
        setter(v)
      }
    }
  }, [get()])

  return computedState
}
