# Vue Router 5 기초

## 설치 및 설정

```bash
npm install vue-router@5
```

## 기본 라우터 설정

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/about', component: AboutView },
    {
      path: '/user/:id',
      component: UserView,
    },
  ],
})
```

## 동적 라우트

```vue
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const userId = route.params.id
</script>
```

## 프로그래매틱 네비게이션

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// 이동
router.push('/home')
router.push({ name: 'user', params: { id: 123 } })

// 뒤로가기
router.back()
```

## 라우트 가드

```typescript
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'login' }
  }
})
```
