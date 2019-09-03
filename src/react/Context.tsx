import React, { useMemo, useEffect, useContext } from 'react'

export const Context = React.createContext(null)

export const Provider = ({ children }) => {
  let store = useMemo(() => {
    return { listeners: [], unlisteners: [] }
  }, [])

  useEffect(() => {
    for (let i = 0; i < store.listeners.length; i++) {
      store.unlisteners.push(store.listeners[i]())
    }
    return () => {
      for (let i = 0; i < store.unlisteners.length; i++) {
        let unlistener = store.unlisteners[i]
        if (typeof unlistener === 'function') {
          unlistener()
        }
      }
    }
  })

  return <Context.Provider value={store}>{children}</Context.Provider>
}

export const useProviderEffect = f => {
  let store = useContext(Context)

  useEffect(() => {
    if (!store) return
    store.listeners.push(f)
    return () => {
      let index = store.listeners.indexOf(f)
      if (index !== -1) store.listeners.splice(index, 1)
    }
  })
}
