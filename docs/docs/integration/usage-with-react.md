# Integration with React

Install `mobx-react-lite` first:

```bash
npm install mobx-react-lite
```

Keep in mind that `accessor` is just a normal observable. All we need is to wrap components that use observables with `observer` from `mobx-react-lite`.

```tsx
import { observer } from 'mobx-react-lite';

export default observer(function MyComponent() {
  return (
    <div>
      {/* Access state and getters */}
      <div>{accessor.value} * 2 = {accessor.double}</div>
      {/* Dispatch actions or mutations */}
      <button onClick={accessor.increase}>Increase</button>
    </div>
  );
});
```
