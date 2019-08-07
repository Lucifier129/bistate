import { useRef, useLayoutEffect, useCallback } from 'react'
import { mutate } from '../createBistate'

export default function useMutate(callback) {
  let callbackRef = useRef(callback)
  let update = useCallback(
    (...args) => {
      mutate(() => callbackRef.current(...args))
    },
    [callbackRef]
  )

  useLayoutEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return update
}
