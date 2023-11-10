# mobx-accessor

Using `mobx` from a common accessor.

## Usage

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

// Now you can access everything from `accessor`
accessor.increase();
accessor.addUp(5);
console.log(accessor.value, accessor.double);
```

Use it in a React component:

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
