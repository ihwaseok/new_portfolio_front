# Big-O 표기법

## 개념

알고리즘의 **시간/공간 복잡도**를 입력 크기 n에 대한 함수로 표현.

## 복잡도 순서 (빠름 → 느림)

```
O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)
```

## 각 복잡도 예시

### O(1) — 상수 시간
```typescript
function getFirst(arr: number[]): number {
  return arr[0]  // 배열 크기에 무관
}
```

### O(log n) — 로그 시간
```typescript
function binarySearch(arr: number[], target: number): number {
  let left = 0, right = arr.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (arr[mid] === target) return mid
    else if (arr[mid] < target) left = mid + 1
    else right = mid - 1
  }
  return -1
}
```

### O(n) — 선형 시간
```typescript
function findMax(arr: number[]): number {
  let max = arr[0]
  for (const num of arr) {
    if (num > max) max = num
  }
  return max
}
```

### O(n²) — 이차 시간
```typescript
// 중첩 반복문
function hasDuplicate(arr: number[]): boolean {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true
    }
  }
  return false
}

// O(n)으로 개선 가능
function hasDuplicateFast(arr: number[]): boolean {
  return new Set(arr).size !== arr.length
}
```

## 공간 복잡도

| 알고리즘 | 공간 복잡도 |
|----------|------------|
| 일반 변수 | O(1) |
| 배열 복사 | O(n) |
| 재귀 호출 | O(깊이) |
| 2D 배열 | O(n²) |

## 코테 팁

- O(n²) 이상이면 입력 크기 10,000 이상에서 TLE
- O(n log n) 이하를 목표로
- 해시맵 활용으로 O(n²) → O(n) 최적화 자주 씀
