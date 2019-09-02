import useBistate from './useBistate'
import useMutate from './useMutate'
import { Bistate } from '../createBistate'

type Bireducer2Dispatch<R> = R extends (S: any, action: infer Action) => infer Result
  ? (action: Action) => Result
  : never

type UseBireducerReturn<T, R> = [Bistate<T>, Bireducer2Dispatch<R>]

type Bireducer<T> = (S: Bistate<T>, action: any) => any

export default function useBireducer<T extends object, R extends Bireducer<T>>(
  reducer: R,
  initialState: T
): UseBireducerReturn<T, R> {
  let state = useBistate(initialState)
  let dispatch = useMutate((action => reducer(state, action)) as Bireducer2Dispatch<R>)

  return [state, dispatch]
}
