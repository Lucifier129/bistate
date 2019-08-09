import 'jest'
import createBistate, { mutate, watch, remove, isBistate } from '../src/createBistate'

describe('createBistate', () => {
  it('should throw error when createBistate got invalide arguments', () => {
    expect(() => {
      createBistate(undefined as any)
    }).toThrow()

    expect(() => {
      createBistate(1 as any)
    }).toThrow()

    expect(() => {
      createBistate('123' as any)
    }).toThrow()

    expect(() => {
      createBistate(null as any)
    }).toThrow()

    createBistate([])
    createBistate({})
  })

  it('can be detected by isBistate', () => {
    expect(isBistate(1)).toBe(false)
    expect(isBistate('1')).toBe(false)
    expect(isBistate([])).toBe(false)
    expect(isBistate({})).toBe(false)
    expect(isBistate(null)).toBe(false)
    expect(isBistate(undefined)).toBe(false)
    expect(isBistate(() => {})).toBe(false)
    expect(isBistate(createBistate({}))).toBe(true)
    expect(isBistate(createBistate([]))).toBe(true)
  })

  it('should not reuse or mutate state which is came from arguments', () => {
    let initialState = {
      a: 1
    }
    let state0 = createBistate(initialState)

    expect(state0 !== initialState).toBe(true)

    let state1 = createBistate(state0)

    expect(state1 !== state0).toBe(true)
    expect(state1 !== initialState)

    expect(state1).toEqual({
      a: 1
    })
    expect(state0).toEqual({
      a: 1
    })
    expect(initialState).toEqual({
      a: 1
    })
  })

  it('can be watched', () => {
    let state = createBistate({ count: 0 })
    let n = 0

    watch(state, nextState => {
      expect(n).toBe(0)
      expect(nextState !== state).toBe(true)
      expect(state.count).toBe(0)
      expect(nextState.count).toBe(1)
      n += 1
    })

    mutate(() => {
      state.count += 1
    })

    expect(n).toBe(1)
    expect(state.count).toBe(0)
  })

  it('can be unwatched', () => {
    let state = createBistate({ count: 0 })

    let unwatch = watch(state, () => {
      throw new Error('unwatch failed')
    })

    unwatch()

    mutate(() => {
      state.count += 1
    })

    expect(state.count).toBe(0)
  })

  it('should detect object mutation', () => {
    let state = createBistate({
      a: 1,
      b: 2,
      c: 3
    })
    let n = 0

    watch(state, nextState => {
      expect(n).toBe(0)

      n += 1

      expect(nextState).toEqual({
        a: 2,
        c: 3,
        d: 1
      })

      expect(state).toEqual({
        a: 1,
        b: 2,
        c: 3
      })
    })

    mutate(() => {
      // replace
      state.a += 1

      // delete
      delete state.b

      // add
      state.d = 1
    })

    expect(n).toBe(1)
  })

  it('should detect list mutation', () => {
    let list = createBistate([1, 2, 3, 4, 5, 6])
    let n = 0

    watch(list, nextList => {
      expect(n).toBe(0)
      expect(nextList).toEqual([2, 3, 4, 5, 6, 3])
      expect(list).toEqual([1, 2, 3, 4, 5, 6])
      n += 1
    })

    mutate(() => {
      // replace
      list[0] = 2

      // delete
      list.splice(1, 1)

      // add
      list.push(3)
    })

    expect(n).toBe(1)
  })

  it('should support deep update', () => {
    let state = createBistate([
      {
        a: {
          b: {
            c: {
              d: [1, 2, 3],
              e: 2,
              f: 1
            }
          }
        }
      }
    ])
    let n = 0

    watch(state, nextState => {
      expect(n).toBe(0)
      n += 1

      expect(nextState).toEqual([
        {
          a: {
            b: {
              c: {
                d: [2, 3, 4],
                e: 3
              }
            }
          }
        }
      ])
    })

    mutate(() => {
      // add item
      state[0].a.b.c.d.push(4)
      // remove item
      state[0].a.b.c.d.shift()
      // replace property value
      state[0].a.b.c.e += 1
      // delete
      delete state[0].a.b.c.f
    })

    expect(n).toBe(1)
  })

  it('should throw error when mutate(f) got async function or return promise', () => {
    expect(() => {
      mutate(async () => {
        //
      })
    }).toThrow()

    expect(() => {
      mutate(() => {
        return Promise.resolve()
      })
    }).toThrow()
  })

  it('should throw error when mutate state out of mutate function', () => {
    let state = createBistate({ count: 0 })

    expect(() => {
      state.count += 1
    }).toThrow()
  })

  it('should throw error when mutate state in watcher function', () => {
    let state = createBistate({ count: 0 })
    let n = 0

    watch(state, nextState => {
      expect(n).toBe(0)

      n += 1

      expect(() => {
        state.count += 1
      }).toThrow()

      expect(() => {
        nextState.count += 1
      }).toThrow()
    })

    mutate(() => {
      state.count += 1
    })

    expect(n).toBe(1)
  })

  it('should throw error when watch a state twice', () => {
    let state = createBistate({ a: 1 })

    let unwatch = watch(state, () => {
      // empty
    })

    expect(() => {
      watch(state, () => {
        // empty
      })
    }).toThrow()

    unwatch()

    watch(state, () => {
      // empty
    })
  })

  it('should throw error when watch a state which is not a bistate or watcher is not a function', () => {
    expect(() => {
      watch({}, () => {
        //
      })
    }).toThrow()

    expect(() => {
      watch(createBistate({}), 1 as any)
    })
  })

  it('should batch all mutation into one update when mutate state', () => {
    let state = createBistate({ a: 1, b: 2, c: 3 })

    let n = 0

    watch(state, nextState => {
      expect(n).toBe(0)
      n += 1

      expect(nextState).toEqual({
        a: 2,
        b: 3
      })

      expect(state).toEqual({
        a: 1,
        b: 2,
        c: 3
      })
    })

    mutate(() => {
      state.a += 1
      state.b += 1
      delete state.c
    })

    expect(n).toBe(1)
  })

  it('can batch multiple states changed and trigger watcher in mutated order', () => {
    let state0 = createBistate({ a: 1 })
    let state1 = createBistate({ a: 2 })
    let n = 0

    watch(state0, nextState0 => {
      expect(n).toBe(1)
      n += 1
      expect(nextState0).toEqual({
        a: 2
      })
    })

    watch(state1, nextState0 => {
      expect(n).toBe(0)
      n += 1
      expect(nextState0).toEqual({
        a: 1
      })
    })

    mutate(() => {
      state1.a -= 1
      state0.a += 1
    })

    expect(n).toBe(2)
  })

  it('mutate function can return value', () => {
    let state = createBistate({ count: 0 })

    let n = mutate(() => {
      state.count += 1
      return state.count
    })

    expect(state.count).toBe(0)
    expect(n).toBe(1)
  })

  it('mutate function can be nest', () => {
    let state = createBistate({ count: 0 })
    let i = 0

    watch(state, nextState => {
      expect(i).toBe(0)
      expect(nextState)
    })

    let n = mutate(() => {
      state.count += 1
      return mutate(() => {
        state.count += 1
        return state.count
      })
    })

    expect(state.count).toBe(0)
    expect(n).toBe(2)
  })

  it('can remove object property by remove function', () => {
    let state = createBistate({
      a: {
        value: 1
      }
    })
    let n = 0

    watch(state, nextState => {
      expect(n).toBe(0)
      n += 1
      expect(nextState).toEqual({})
      expect(state).toEqual({
        a: {
          value: 1
        }
      })
    })

    expect(() => {
      remove(state.a)
    }).toThrow()

    mutate(() => {
      remove(state.a)
    })
  })
})
