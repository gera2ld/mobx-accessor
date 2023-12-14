# mobx-accessor

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]

Using `mobx` from a common accessor.

## Installation

```bash
$ npm install mobx-accessor
```

## Usage

### Basic Usage

Define mandatory `state` and optional `mutations`, `getters`, `actions` first, where

- `state` holds the actual data
- `mutations` are the only way to modify `state`
- `getters` derives values from `state` and other `getters`
- `actions` connects the logic with the data

```ts
import {
  actionTree,
  getterTree,
  makeAccessor,
  mutationTree,
} from 'mobx-accessor';

const defState = () => ({
  value: 0,
});

const defMutations = mutationTree({ state: defState }, {
  increase(state) {
    state.value++;
  },
  addUp(state, delta: number) {
    state.value += delta;
  },
});

const defGetters = getterTree({ state: defState }, {
  double(state) {
    return state.value * 2;
  },
});

const defActions = actionTree({ state: defState, getters: defGetters, mutations: defMutations }, {
  async rock({ state, getters, mutations }) {
    // await is allowed
    await doStuff();
    // change value through `mutations`, don't modify `state` directly
    mutations.increase();
    // check the latest values
    console.log(state.value, getters.double);
  },
  rockPayload({ mutations }, delta: number) {
    mutations.addUp(delta);
  },
});

const accessor = makeAccessor({
  state: defState,
  mutations: defMutations,
  getters: defGetters,
  actions: defActions,
});
```

Then access your data and functions from anywhere through the `accessor`:

```ts
// Mutations / Actions
accessor.increase();
accessor.addUp(5);

// State / Getters
console.log(accessor.value, accessor.double);
```

### Use with React

Keep in mind that `accessor` is just a normal observable. All we need is to wrap your components that
use observables with `observer` from `mobx-react-lite`.

```tsx
import { observer } from 'mobx-react-lite';

// All you need is to wrap your component using `accessor` with `observer`
export default observer(function MyComponent() {
  return (
    <div>
      <div>{accessor.value} * 2 = {accessor.double}</div>
      <button onClick={accessor.increase}>Increase</button>
    </div>
  );
});
```

### Dump and Load

We can easily dump and load the data of an accessor anytime, which helps to reproduce what the user sees.

```ts
import { dumpState, loadState } from 'mobx-accessor';

const state = dumpState(accessor);

loadState(accessor, stateFromBob);
console.log(accessor.value); // -> Bob's value
```

## Credits

This project is heavily inspired by [typed-vuex](https://github.com/danielroe/typed-vuex).

With exactly the same APIs, we can even share the logic between projects written in React and Vue.

[npm-version-src]: https://img.shields.io/npm/v/mobx-accessor?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/mobx-accessor
[npm-downloads-src]: https://img.shields.io/npm/dm/mobx-accessor?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/mobx-accessor
[bundle-src]: https://img.shields.io/bundlephobia/minzip/mobx-accessor?style=flat&colorA=18181B&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=mobx-accessor
[jsdocs-src]: https://img.shields.io/badge/jsDocs.io-reference-18181B?style=flat&colorA=18181B&colorB=F0DB4F
[jsdocs-href]: https://www.jsdocs.io/package/mobx-accessor
