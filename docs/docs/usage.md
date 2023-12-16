---
sidebar_position: 3
---

# Usage

Now we are going to build our `accessor` from its components.

Helpers can be imported from `mobx-accessor`:

```ts
import {
  actionTree,
  getterTree,
  mutationTree,
  makeAccessor,
} from 'mobx-accessor';
```

## State

**State** is just an object holding the data needed for the view, usually retrieved from backend. We must define it with all possible fields.

```ts
const defState = () => ({
  value: 1,
});
```

All fields in **state** will be accessible as *getters* from the `accessor`.

In this example, the state has only one field `value` which is an integer. The types can be inferred from the definition, so we don't have to declare it explicitly. The final accessor will have a getter:

```ts
// Automatically created
interface ExampleAccessor {
  readonly value: number;
}
```

## Mutations

**Mutations** are functions that modify the **state** synchronously. It is only allowed to modify data through **mutations** in `mobx-accessor`.

We use the `mutationTree` helper to infer the types.

```ts
const defMutations = mutationTree({ state: defState }, {
  increase(state) {
    state.value++;
  },
  addUp(state, delta: number) {
    state.value += delta;
  },
});
```

Each function can have at most 2 parameters, the first being the current state, and the second being the payload called with this mutation.

In the example above, we will add two functions to the `accessor`:

```ts
// Automatically created
interface ExampleAccessor {
  increase(): void;
  addUp(delta: number): void;
}
```

## Getters

**Getters** are values computed from **state** or other **getters**. Thanks to MobX, they will always be updated automatically if any of their dependencies are changed.

We use the `getterTree` helper to infer the types.

```ts
const defGetters = getterTree({ state: defState }, {
  double(state) {
    return state.value * 2;
  },
  doubleAgain(state, getters) {
    const double = getters.double as number;
    return double * 2;
  },
});
```

Each function can have at most 2 parameters, the first being the current state, and the second being an object of all available getters.

Note:
- The type of the second parameter `getters` cannot be inferred as it depends on the type of itself.
- **Getters** are supposed to derive values immediately, without the ability to modify the state, thus have no access to **mutations** or **actions**.

In the example above, we will add two getters to `accessor`:

```ts
// Automatically created
interface ExampleAccessor {
  readonly double: number;
  readonly doubleAgain: number;
}
```

## Actions

**Actions** are functions dealing with the logic. It can be either synchronous or asynchronous.

We use the `actionTree` helper to infer the types.

```ts
const defActions = actionTree({
  state: defState,
  getters: defGetters,
  mutations: defMutations,
}, {
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
    return delta;
  },
});
```

Each function can have at most two parameters, the first being an object of the current `{ state, getters, mutations }`, and the second being the payload called with this action.

Note:
- **Actions** have access to the current **state**, **getters** and **mutations**.
- However, **actions** cannot modify **state** directly. Modification must be done through **mutations** so that MobX can easily get notified of the changes.

In the example above, we will add two functions to the `accessor`:

```ts
// Automatically created
interface ExampleAccessor {
  rock: () => Promise<void>;
  rockPayload: (delta: number) => number;
}
```

## Accessor

Now let's build the `accessor` with `makeAccessor`:

```ts
const accessor = makeAccessor({
  state: defState,
  mutations: defMutations,
  getters: defGetters,
  actions: defActions,
});
```

Now we can access everything we defined earlier from the accessor:

```ts
// typeof accessor
interface ExampleAccessor {
  // From State
  readonly value: number;
  // From Getters
  readonly double: number;
  readonly doubleAgain: number;

  // From Mutations
  increase(): void;
  addUp(delta: number): void;
  // From Actions
  rock: () => Promise<void>;
  rockPayload: (delta: number) => number;
}
```

Note:
- Since all properties will be merged into one accessor, no duplicate names are allowed.
