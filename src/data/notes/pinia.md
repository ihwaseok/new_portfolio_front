# Pinia 상태관리

## Pinia란?

Pinia는 Vue의 공식 상태 관리 라이브러리입니다. Vuex보다 더 간단하고 타입 안전합니다.

## 스토어 정의

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const name = ref('')
  const isLoggedIn = ref(false)

  const displayName = computed(() =>
    isLoggedIn.value ? name.value : '게스트'
  )

  function login(userName: string) {
    name.value = userName
    isLoggedIn.value = true
  }

  function logout() {
    name.value = ''
    isLoggedIn.value = false
  }

  return { name, isLoggedIn, displayName, login, logout }
})
```

## 컴포넌트에서 사용

```vue
<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 직접 접근
console.log(userStore.displayName)

// 액션 호출
userStore.login('홍길동')
</script>
```

## storeToRefs

```typescript
import { storeToRefs } from 'pinia'

const { name, isLoggedIn } = storeToRefs(userStore)
// name, isLoggedIn은 반응형 ref
```

> `storeToRefs`를 사용하면 구조분해 할당 후에도 반응성이 유지됩니다.
