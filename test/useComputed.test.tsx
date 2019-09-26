import 'jest'
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { useBistate, useMutate, useComputed } from '../src/react'

const delay = (timeout = 0) => new Promise(resolve => setTimeout(resolve, timeout))

const createDeferred = () => {
  let resolve
  let reject
  let promise = new Promise((a, b) => {
    resolve = a
    reject = b
  })
  return { resolve, reject, promise }
}

describe('useComputed', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    container = null
  })

  it('basic usage', () => {
    let count = 0
    let Test = (props: { count?: number }) => {
      let original = useBistate({ count: props.count || 0, unchanged: 0 })

      let computed = useComputed({
        get: () => original.count + 1,
        set: count => (original.count = count - 1)
      })

      let increOriginal = useMutate(() => {
        original.count += 1
      })

      let increComputed = useMutate(() => {
        computed.value += 1
      })

      let increBoth = () => {
        increOriginal()
        increComputed()
      }

      let unchanged = useComputed({
        get: () => original.unchanged,
        set: n => (original.unchanged = n)
      })

      let increUnchanged = useMutate(() => {
        unchanged.value += 1
      })

      useEffect(() => {
        if (count === 0) {
          expect(unchanged.value).toBe(0)
        }

        if (count === 1) {
          expect(unchanged.value).toBe(1)
        }

        if (count > 1) {
          throw new Error('Failed to keep unchanged state unchanged')
        }

        count += 1
      }, [unchanged])

      return (
        <>
          <button onClick={increOriginal} id="original">
            {original.count}
          </button>
          <button onClick={increComputed} id="computed">
            {computed.value}
          </button>
          <button onClick={increBoth} id="both">
            {original.count + computed.value}
          </button>

          <button onClick={increBoth} id="both">
            {original.count + computed.value}
          </button>

          <button onClick={increUnchanged} id="unchanged">
            {original.unchanged}
          </button>
        </>
      )
    }

    act(() => {
      ReactDOM.render(<Test />, container)
    })

    let original = container.querySelector('#original')
    let computed = container.querySelector('#computed')
    let both = container.querySelector('#both')
    let unchanged = container.querySelector('#unchanged')

    expect(original.textContent).toBe('0')
    expect(computed.textContent).toBe('1')
    expect(both.textContent).toBe('1')
    expect(unchanged.textContent).toBe('0')

    // click original
    act(() => {
      original.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(original.textContent).toBe('1')
    expect(computed.textContent).toBe('2')
    expect(both.textContent).toBe('3')
    expect(unchanged.textContent).toBe('0')

    // click computed
    act(() => {
      computed.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(original.textContent).toBe('2')
    expect(computed.textContent).toBe('3')
    expect(both.textContent).toBe('5')
    expect(unchanged.textContent).toBe('0')

    // click both
    act(() => {
      both.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(original.textContent).toBe('4')
    expect(computed.textContent).toBe('5')
    expect(both.textContent).toBe('9')
    expect(unchanged.textContent).toBe('0')

    // click unchanged
    act(() => {
      unchanged.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(original.textContent).toBe('4')
    expect(computed.textContent).toBe('5')
    expect(both.textContent).toBe('9')
    expect(unchanged.textContent).toBe('1')
  })
})
