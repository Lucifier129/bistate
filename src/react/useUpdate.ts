import { useState, useCallback } from 'react'

const useUpdate = () => {
  let [_, setState] = useState(0)
  let update = useCallback(() => setState(count => count + 1), [setState])
  return update
}

export default useUpdate
