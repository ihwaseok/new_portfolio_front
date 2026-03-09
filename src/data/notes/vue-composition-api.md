# Vue 3 Composition API 가이드

## 개요

Vue 3의 Composition API는 컴포넌트 로직을 더 유연하게 재사용할 수 있도록 설계되었습니다.

## setup() 함수

```typescript
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)

    function increment() {
      count.value++
    }

    onMounted(() => {
      console.log('컴포넌트가 마운트되었습니다.')
    })

    return { count, doubled, increment }
  }
}
```

## `<script setup>` 문법 (권장)

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
}
</script>
```

## 반응형 데이터

| API | 용도 |
|-----|------|
| `ref()` | 원시값 반응형 |
| `reactive()` | 객체 반응형 |
| `computed()` | 계산된 값 |
| `watch()` | 값 변화 감지 |

## Composables (커스텀 훅)

```typescript
// useCounter.ts
import { ref } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  function increment() { count.value++ }
  function decrement() { count.value-- }
  function reset() { count.value = initialValue }

  return { count, increment, decrement, reset }
}
```

> **Tip:** Composable 함수는 `use` 접두사를 사용하는 것이 관례입니다.
