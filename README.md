# Welcome to bistate 👋

[![npm version](https://img.shields.io/npm/v/bistate.svg?style=flat)](https://www.npmjs.com/package/bistate)
[![Build Status](https://travis-ci.org/Lucifier129/bistate.svg?branch=master)](https://travis-ci.org/Lucifier129/bistate)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/Lucifier129/bistate#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Lucifier129/bistate/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Lucifier129/bistate/blob/master/LICENSE)
[![Twitter: guyingjie129](https://img.shields.io/twitter/follow/guyingjie129.svg?style=social)](https://twitter.com/guyingjie129)

> mutate the current state to generate the next state and restore the current one to keep two state immutable

**bistate** is a tiny package that allows you to work with immutable state in a more reactive way, inspired by vue 3.0 reactivity api and immer.

### 🏠 [Homepage](https://github.com/Lucifier129/bistate#readme)

## Benefits

bistate likes immer

- Immutability with normal JavaScript objects and arrays. No new APIs to learn!
- Strongly typed, no string based paths selectors etc.
- Structural sharing out of the box
- Deep updates are a breeze
- Boilerplate reduction. Less noise, more concise code.
- Small script size
- supports react-hooks api
- mutate parent component's state in child component

## Environment Requirement

- ES2015 Proxy
- ES2015 Symbol

[Can I Use Proxy?](https://caniuse.com/#search=Proxy)

## Install

```sh
npm install --save bistate
```

```sh
yarn add bistate
```

## [API DOCS](/docs/API.md)

## Usage

### Counter

```javascript
import React, { useEffect } from 'react'
import { useBistate, useMutate } from 'bistate/react'

export default function Counter() {
  let [state] = useBistate({ count: 0 })

  let incre = useMutate(() => {
    state.count += 1
  })

  let decre = useMutate(() => {
    state.count -= 1
  })

  useEffect(() => {
    let timer = setInterval(incre, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      <button onClick={incre}>+1</button>
      {state.count}
      <button onClick={decre}>-1</button>
    </div>
  )
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
