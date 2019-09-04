# Welcome to bistate 👋

[![npm version](https://img.shields.io/npm/v/bistate.svg?style=flat)](https://www.npmjs.com/package/bistate)
[![Build Status](https://travis-ci.org/Lucifier129/bistate.svg?branch=master)](https://travis-ci.org/Lucifier129/bistate)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/Lucifier129/bistate#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Lucifier129/bistate/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Lucifier129/bistate/blob/master/LICENSE)
[![Twitter: guyingjie129](https://img.shields.io/twitter/follow/guyingjie129.svg?style=social)](https://twitter.com/guyingjie129)

> Create the next immutable state tree by simply modifying the current tree

**bistate** is a tiny package that allows you to work with the immutable state in a more mutable and reactive way, inspired by vue 3.0 reactivity API and immer.

### 🏠 [Homepage](https://github.com/Lucifier129/bistate#readme)

## Benefits

**bistate** is like immer but more reactive

- Immutability with normal JavaScript objects and arrays. No new APIs to learn!
- Strongly typed, no string based paths selectors etc.
- Structural sharing out of the box
- Deep updates are a breeze
- Boilerplate reduction. Less noise, more concise code.
- Provide react-hooks API
- Small size
- Reactive

## Environment Requirement

- ES2015 Proxy
- ES2015 Symbol

[Can I Use Proxy?](https://caniuse.com/#search=Proxy)

## How it works

Every immutable state is wrapped by a proxy, has a scapegoat state by the side.

`immutable state` + `scapegoat state` = **bistate**

- the immutable target is freezed by proxy
- scapegoat has the same value as the immutable target
- mutate(() => { **the_mutable_world** }), when calling `mutate(f)`, it will
  - switch all operations to scapegoat instead of the immutable target when executing
  - switch back to the immutable target after executed
  - create the next bistate via `scapegoat` and `target`, sharing the unchanged parts
  - we get two immutable states now

## Install

```sh
npm install --save bistate
```

```sh
yarn add bistate
```

## Usage

### Counter

- [demo](https://lucifier129.github.io/bistate-examples/build/#Counter)
- [source-code](https://github.com/Lucifier129/bistate-examples/blob/master/src/demos/Counter.js)

```javascript
import React from 'react'
// import react-hooks api from bistate/react
import { useBistate, useMutate } from 'bistate/react'

export default function Counter() {
  // create state via useBistate
  let state = useBistate({ count: 0 })

  // safely mutate state via useMutate
  let incre = useMutate(() => {
    state.count += 1
  })

  let decre = useMutate(() => {
    state.count -= 1
  })

  return (
    <div>
      <button onClick={incre}>+1</button>
      {state.count}
      <button onClick={decre}>-1</button>
    </div>
  )
}
```

### TodoApp

- [demo](https://lucifier129.github.io/bistate-examples/build/#TodoApp)
- [source-code](https://github.com/Lucifier129/bistate-examples/blob/master/src/demos/TodoApp.js)

```javascript
function Todo({ todo }) {
  let edit = useBistate({ value: false })
  /**
   * bistate text is reactive
   * we will pass the text down to TodoInput without the need of manually update it in Todo
   * */
  let text = useBistate({ value: '' })

  // create a mutable function via useMutate
  let handleEdit = useMutate(() => {
    edit.value = !edit.value
    text.value = todo.content
  })

  let handleEdited = useMutate(() => {
    edit.value = false
    if (text.value === '') {
      // remove the todo from todos via remove function
      remove(todo)
    } else {
      // mutate todo even it is not a local bistate
      todo.content = text.value
    }
  })

  let handleKeyUp = useMutate(event => {
    if (event.key === 'Enter') {
      handleEdited()
    }
  })

  let handleRemove = useMutate(() => {
    remove(todo)
  })

  let handleToggle = useMutate(() => {
    todo.completed = !todo.completed
  })

  return (
    <li>
      <button onClick={handleRemove}>remove</button>
      <button onClick={handleToggle}>{todo.completed ? 'completed' : 'active'}</button>
      {edit.value && <TodoInput text={text} onBlur={handleEdited} onKeyUp={handleKeyUp} />}
      {!edit.value && <span onClick={handleEdit}>{todo.content}</span>}
    </li>
  )
}

function TodoInput({ text, ...props }) {
  let handleChange = useMutate(event => {
    /**
     * we just simply and safely mutate text at one place
     * instead of every parent components need to handle `onChange` event
     */
    text.value = event.target.value
  })
  return <input type="text" {...props} onChange={handleChange} value={text.value} />
}
```

## API

```javascript
import { createStore, mutate, remove, isBistate, debug, undebug } from 'bistate'
import { useBistate, useMutate, useBireducer, view, useAttr, useAttrs } from 'bistate/react'
```

### useBistate(array | object, bistate?) -> bistate

receive an array or an object, return bistate.

if the second argument is another bistate which has the same shape with the first argument, return the second argument instead.

```javascript
let Child = (props: { counter?: { count: number } }) => {
  // if props.counter is existed, use props.counter, otherwise use local bistate.
  let state = useBistate({ count: 0 }, props.counter)

  let handleClick = useMutate(() => {
    state.count += 1
  })

  return <div onClick={handleClick}>{state.count}</div>
}

// use local bistate
<Child />
// use parent bistate
<Child counter={state} />
```

### useMutate((...args) => any_value) -> ((...args) => any_value)

receive a function as argument, return the mutable_function

it's free to mutate any bistates in mutable_function, not matter where they came from(they can belong to the parent component)

### useBireducer(reducer, initialState) -> [state, dispatch]

receive a reducer and an initial state, return a pair [state, dispatch]

its' free to mutate any bistates in the reducer funciton

```javascript
import { useBireducer } from 'bistate/react'

const Test = () => {
  let [state, dispatch] = useBireducer(
    (state, action) => {
      if (action.type === 'incre') {
        state.count += 1
      }

      if (action.type === 'decre') {
        state.count -= 1
      }
    },
    { count: 0 }
  )

  let handleIncre = () => {
    dispatch({ type: 'incre' })
  }

  let handleIncre = () => {
    dispatch({ type: 'decre' })
  }

  // render view
}
```

### view(FC) -> FC

create a two-way data binding function-component

```javascript

const Counter = view(props => {
  // Counter will not know the count is local or came from the parent
  let count = useAttr('count', { value: 0 })

  let handleClick = useMutate(() => {
    count.value += 1
  })

  return <button onClick={handleClick}>{count.value}</button>
})

// use local bistate
<Counter />

// create a two-way data binding connection with parent bistate
<Count count={parentBistate.count} />
```

### useAttrs(initValue) -> Record<string, bistate>

create a record of bistate, when the value in props[key] is bistate, connect it.

useAttrs must use in view(fc)

```javascript

const Test = view(() => {
  // Counter will not know the count is local or came from the parent
  let attrs = useAttrs({ count: { value: 0 } })

  let handleClick = useMutate(() => {
    attrs.count.value += 1
  })

  return <button onClick={handleClick}>{attrs.count.value}</button>
})

// use local bistate
<Counter />

// create a two-way data binding connection with parent bistate
<Count count={parentBistate.count} />
```

### useAttr(key, initValue) -> bistate

a shortcut of `useAttrs({ [key]: initValue })[key]`, it's useful when we want to separate attrs

### createStore(initialState) -> { subscribe, getState }

create a store with an initial state

#### store.subscribe(listener) -> unlisten

subscribe to the store, and return an unlisten function

Every time the state has been mutated, a new state will publish to every listener.

#### store.getState() -> state

get the current state in the store

```javascript
let store = createStore({ count: 1 })
let state = store.getState()

let unlisten = store.subscribe(nextState => {
  expect(state).toEqual({ count: 1 })
  expect(nextState).toEqual({ count: 2 })
  unlisten()
})

mutate(() => {
  state.count += 1
})
```

### mutate(f) -> value_returned_by_f

immediately execute the function and return the value

it's free to mutate the bistate in mutate function

### remove(bistate) -> void

remove the bistate from its parent

### isBistate(input) -> boolean

check if input is a bistate or not

### debug(bistate) -> void

enable debug mode, break point when bistate is mutating

### undebug(bistate) -> void

disable debug mode

## Caveats

- only supports array and object, other data types are not allowed

- bistate is unidirectional, any object or array appear only once, no circular references existed

```javascript
let state = useBistate([{ value: 1 }])

mutate(() => {
  state.push(state[0])
  // nextState[0] is equal to state[0]
  // nextState[1] is not equal to state[0], it's a new one
})
```

- can not spread object or array as props, it will lose the reactivity connection in it, should pass the reference

```javascript

// don't do this
<Todo {...todo} />

// do this instead
<Todo todo={todo} />
```

- can not edit state or props via react-devtools, the same problem as above

- useMutate or mutate do not support async function

```javascript
const Test = () => {
  let state = useBistate({ count: 0 })

  // don't do this
  let handleIncre = useMutate(async () => {
    let n = await fetchData()
    state.count += n
  })

  // do this instead
  let incre = useMutate(n => {
    state.count += n
  })

  let handleIncre = async () => {
    let n = await fetchData()
    incre(n)
  }

  return <div onClick={handleIncre}>test</div>
}
```

- can not mutate state twice in event-handler which is not async

Why? Because every state can only be mutated once, and React will batching setState in event-handler.

So call mutate function twice will mutate the state twice too.

In async mode, react batching not work, call mutate function twice will mutate difference state.

if you really want to call mutate function twice, wrap the event-handler via `useMutate`.

```javascript
const Test = () => {
  let state = useBistate({ count: 0 })

  let incre = useMutate(n => {
    state.count += n
  })

  // don't do this
  let handleIncre = () => {
    incre(1)
    incre(1)
  }

  // do this
  let handleIncre = useMutate(() => {
    incre(1)
    incre(1)
  })

  return <div onClick={handleIncre}>test</div>
}
```

## Author

👤 **Jade Gu**

- Twitter: [@guyingjie129](https://twitter.com/guyingjie129)
- Github: [@Lucifier129](https://github.com/Lucifier129)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/Lucifier129/bistate/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [Jade Gu](https://github.com/Lucifier129).

This project is [MIT](https://github.com/Lucifier129/bistate/blob/master/LICENSE) licensed.

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
