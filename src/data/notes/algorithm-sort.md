# 정렬 알고리즘

## 시간 복잡도 비교

| 알고리즘 | 평균 | 최악 | 공간 복잡도 |
|----------|------|------|-------------|
| 버블 정렬 | O(n²) | O(n²) | O(1) |
| 선택 정렬 | O(n²) | O(n²) | O(1) |
| 삽입 정렬 | O(n²) | O(n²) | O(1) |
| 합병 정렬 | O(n log n) | O(n log n) | O(n) |
| 퀵 정렬 | O(n log n) | O(n²) | O(log n) |
| 힙 정렬 | O(n log n) | O(n log n) | O(1) |

## 버블 정렬 (Bubble Sort)

인접한 두 원소를 비교하며 교환하는 방식.

```typescript
function bubbleSort(arr: number[]): number[] {
  const n = arr.length
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
      }
    }
  }
  return arr
}
```

## 퀵 정렬 (Quick Sort)

피벗을 기준으로 분할 정복하는 방식. 평균적으로 가장 빠름.

```typescript
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr

  const pivot = arr[Math.floor(arr.length / 2)]
  const left = arr.filter(x => x < pivot)
  const mid = arr.filter(x => x === pivot)
  const right = arr.filter(x => x > pivot)

  return [...quickSort(left), ...mid, ...quickSort(right)]
}
```

## 합병 정렬 (Merge Sort)

배열을 절반으로 나누어 재귀적으로 정렬 후 병합.

```typescript
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr

  const mid = Math.floor(arr.length / 2)
  const left = mergeSort(arr.slice(0, mid))
  const right = mergeSort(arr.slice(mid))

  return merge(left, right)
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = []
  let i = 0, j = 0

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++])
    else result.push(right[j++])
  }

  return [...result, ...left.slice(i), ...right.slice(j)]
}
```

## 언제 무엇을 쓸까?

- **소규모 데이터** → 삽입 정렬 (오버헤드 적음)
- **일반적인 경우** → 퀵 정렬 (캐시 효율 좋음)
- **안정 정렬 필요** → 합병 정렬
- **메모리 제한** → 힙 정렬
