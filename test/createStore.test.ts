import 'jest'
import { mutate, watch, remove, isBistate } from '../src/createBistate'
import createStore from '../src/createStore'

describe('createStore', () => {
  it('can createStore correctly', () => {
    let store = createStore({})
    expect(typeof store.getState).toBe('function')
    expect(typeof store.subscribe).toBe('function')
    expect(store.getState()).toEqual({})
  })

  it('can subscribe and publish', () => {
    let store = createStore({ count: 1 })
    let state = store.getState()
    let n = 0

    store.subscribe(nextState => {
      expect(n).toBe(0)
      expect(state).toEqual({ count: 1 })
      expect(nextState).toEqual({ count: 2 })
      n += 1
    })

    mutate(() => {
      state.count += 1
    })

    expect(store.getState()).toEqual({ count: 2 })
    expect(n).toBe(1)
  })

  it('can be unsubscribe', () => {
    let store = createStore({ count: 1 })

    let unlisten = store.subscribe(() => {
      throw new Error('unlisten failed')
    })

    let state = store.getState()

    unlisten()

    mutate(() => {
      state.count += 1
    })

    expect(state).toEqual({ count: 1 })

    let currentState = store.getState()

    expect(currentState).toEqual({
      count: 2
    })
  })

  it('can publish many times', () => {
    let store = createStore({ count: 1 })
    let list = []

    store.subscribe(state => {
      list.push(state)
    })

    let incre = () =>
      mutate(() => {
        let state = store.getState()
        state.count += 1
      })

    incre()
    incre()
    incre()
    incre()

    let state = store.getState()

    expect(state).toEqual({
      count: 5
    })

    expect(list).toEqual([{ count: 2 }, { count: 3 }, { count: 4 }, { count: 5 }])
  })

  it('should throw error when mutate state in listener', () => {
    let store = createStore({ count: 0 })

    let n = 0

    store.subscribe(state => {
      expect(() => {
        n += 1
        state.count += 1
      }).toThrow()
    })

    mutate(() => {
      let state = store.getState()
      state.count += 1
    })

    expect(n).toBe(1)
  })
})
