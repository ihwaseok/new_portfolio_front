# TypeScript 유틸리티 타입

## 내장 유틸리티 타입

### Partial / Required

```typescript
interface User {
  id: number
  name: string
  email: string
}

// 모든 속성을 선택적으로
type PartialUser = Partial<User>
// { id?: number; name?: string; email?: string }

// 모든 속성을 필수로
type RequiredUser = Required<PartialUser>
```

### Pick / Omit

```typescript
// 특정 속성만 선택
type UserPreview = Pick<User, 'id' | 'name'>
// { id: number; name: string }

// 특정 속성 제외
type UserWithoutId = Omit<User, 'id'>
// { name: string; email: string }
```

### Record

```typescript
type Role = 'admin' | 'editor' | 'viewer'

const permissions: Record<Role, string[]> = {
  admin:  ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
}
```

### Readonly

```typescript
const config: Readonly<{ apiUrl: string; timeout: number }> = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
}

// config.apiUrl = '...'  // Error: 읽기 전용
```

## 조건부 타입

```typescript
type IsString<T> = T extends string ? 'yes' : 'no'

type A = IsString<string>  // 'yes'
type B = IsString<number>  // 'no'

// 내장 조건부 타입
type NonNullable<T> = T extends null | undefined ? never : T

type C = NonNullable<string | null | undefined>  // string
```

## 템플릿 리터럴 타입

```typescript
type EventName = 'click' | 'focus' | 'blur'
type Handler = `on${Capitalize<EventName>}`
// 'onClick' | 'onFocus' | 'onBlur'

type ApiEndpoint = `/api/${string}`
const endpoint: ApiEndpoint = '/api/users'  // OK
```

## 제네릭 활용

```typescript
// API 응답 래퍼
interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}

// 제약 조건
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user: User = { id: 1, name: '홍길동', email: 'hong@example.com' }
const name = getProperty(user, 'name')  // string
```

## infer 키워드

```typescript
// 함수 반환 타입 추출
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never

function createUser() {
  return { id: 1, name: '홍길동' }
}

type UserType = ReturnType<typeof createUser>
// { id: number; name: string }
```
