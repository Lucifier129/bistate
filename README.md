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
import { createStore, mutate, remove, isBistate } from 'bistate'
import { useBistate, useMutate, useBireducer } from 'bistate/react'
```

### useBistate(array | object) -> bistate

receive an array or an object, return bistate

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
