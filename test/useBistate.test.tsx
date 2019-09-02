import 'jest'
import React from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { useBistate, useMutate } from '../src/react'

const delay = (timeout = 0) => new Promise(resolve => setTimeout(resolve, timeout))

const noop = () => {}

const createDeferred = () => {
  let resolve
  let reject
  let promise = new Promise((a, b) => {
    resolve = a
    reject = b
  })
  return { resolve, reject, promise }
}

describe('useBistate', () => {
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
    let Test = (props: { count?: number }) => {
      let state = useBistate({ count: props.count || 0 })

      let incre = useMutate(() => {
        state.count += 1
      })

      return <button onClick={incre}>{state.count}</button>
    }

    act(() => {
      ReactDOM.render(<Test />, container)
    })

    let button = container.querySelector('button')

    expect(button.textContent).toBe('0')

    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(button.textContent).toBe('1')

    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(button.textContent).toBe('2')
  })

  it('async usage', async () => {
    let deferred = createDeferred()
    let resolve = () => {
      deferred.resolve()
      deferred = createDeferred()
    }
    let Test = (props: { count?: number }) => {
      let state = useBistate({ count: props.count || 0 })

      let incre = useMutate(() => {
        state.count += 1
      })

      let handleClick = async () => {
        await delay()
        incre()
        resolve()
      }

      return <button onClick={handleClick}>{state.count}</button>
    }

    act(() => {
      ReactDOM.render(<Test />, container)
    })

    let button = container.querySelector('button')

    expect(button.textContent).toBe('0')

    // tslint:disable-next-line: await-promise
    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await deferred.promise
    })

    expect(button.textContent).toBe('1')

    // tslint:disable-next-line: await-promise
    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await deferred.promise
    })

    expect(button.textContent).toBe('2')
  })

  it('can mutate state not matter which component it belongs', () => {
    let Child = ({ data }) => {
      let local = useBistate({ count: 0 })

      let handleClick = useMutate(() => {
        data.count += 1
        local.count += 1
      })

      return (
        <div id="child" onClick={handleClick}>
          {data.count + local.count}
        </div>
      )
    }

    let Parent = () => {
      let state = useBistate({ count: 0 })

      return <Child data={state}></Child>
    }

    act(() => {
      ReactDOM.render(<Parent />, container)
    })

    let div = container.querySelector('#child')

    expect(div.textContent).toBe('0')

    act(() => {
      div.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(div.textContent).toBe('2')

    act(() => {
      div.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(div.textContent).toBe('4')
  })
})
