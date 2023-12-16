---
sidebar_position: 2
---

# Get Started

## Installation

```bash
npm install mobx-accessor mobx
```

We must also install `mobx` since `mobx-accessor` is powered by it.

## Quick Start

```ts
import {
  mutationTree,
  makeAccessor,
} from 'mobx-accessor';

const defState = () => ({
  value: 1,
});

const defMutations = mutationTree({ state: defState }, {
  increase(state) {
    state.value++;
  },
});

const accessor = makeAccessor({
  state: defState,
  mutations: defMutations,
});

console.log(accessor.value); // -> 1
accessor.increase();
console.log(accessor.value); // -> 2
```

## Level Up

See [Usage](./usage) for how to build an full-featured accessor.
