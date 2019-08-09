import useBistate from './useBistate'
import useMutate from './useMutate'

export default function useBireducer(reducer, initialState) {
  let state = useBistate(initialState)
  let dispatch = useMutate(action => reducer(state, action))

  return [state, dispatch]
}
