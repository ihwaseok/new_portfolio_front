# React Hooks 정리

## useState

```tsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>카운트: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>증가</button>
      <button onClick={() => setCount(0)}>초기화</button>
    </div>
  )
}
```

## useEffect

```tsx
import { useState, useEffect } from 'react'

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 마운트 시 or userId 변경 시 실행
    let cancelled = false

    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setUser(data)
      })

    return () => {
      // 클린업: 언마운트 or 재실행 전
      cancelled = true
    }
  }, [userId])  // 의존성 배열

  return <div>{user?.name}</div>
}
```

## useMemo / useCallback

```tsx
import { useMemo, useCallback } from 'react'

function ExpensiveList({ items, filter }: Props) {
  // 값 메모이제이션
  const filtered = useMemo(
    () => items.filter(item => item.includes(filter)),
    [items, filter]
  )

  // 함수 메모이제이션
  const handleClick = useCallback((id: number) => {
    console.log('클릭:', id)
  }, [])  // 의존성 없음 — 절대 재생성 안 됨

  return (
    <ul>
      {filtered.map(item => (
        <li key={item} onClick={() => handleClick(item)}>{item}</li>
      ))}
    </ul>
  )
}
```

## Custom Hook

```tsx
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [url])

  return { data, loading, error }
}

// 사용
function UserList() {
  const { data, loading, error } = useFetch<User[]>('/api/users')

  if (loading) return <p>로딩 중...</p>
  if (error) return <p>에러 발생</p>
  return <ul>{data?.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

## Vue vs React 비교

| | Vue 3 | React |
|---|---|---|
| 상태 | `ref()`, `reactive()` | `useState()` |
| 사이드 이펙트 | `watchEffect()` | `useEffect()` |
| 메모이제이션 | `computed()` | `useMemo()` |
| 재사용 로직 | Composable | Custom Hook |
