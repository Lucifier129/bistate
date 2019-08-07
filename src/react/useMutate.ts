import { useRef, useEffect, useCallback } from 'react'
import { mutate } from '../createBistate'

export default function useMutate(callback) {
  let callbackRef = useRef(callback)
  let update = useCallback(() => {
    mutate(callbackRef.current)
  }, [callbackRef])

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return update
}
