# Integration with Vue

Install `mobx-vue-lite` first:

```bash
npm install mobx-vue-lite
```

Wrap every component using `accessor` with `Observer` from `mobx-vue-lite`.

```html
<script setup>
import { Observer } from 'mobx-vue-lite';
import { accessor } from './accessor';
</script>

<template>
  <Observer>
    <div>
      <!-- Access state and getters -->
      <div>{accessor.value} * 2 = {accessor.double}</div>
      <-- Dispatch actions or mutations -->
      <button onClick={accessor.increase}>Increase</button>
    </div>
  </Observer>
</template>
```
