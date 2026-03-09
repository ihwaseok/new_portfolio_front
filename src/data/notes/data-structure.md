# 자료구조 기초

## 스택 (Stack)

LIFO(Last In, First Out) 구조.

```typescript
class Stack<T> {
  private items: T[] = []

  push(item: T): void {
    this.items.push(item)
  }

  pop(): T | undefined {
    return this.items.pop()
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1]
  }

  get size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }
}

// 사용 예시
const stack = new Stack<number>()
stack.push(1)
stack.push(2)
stack.push(3)
console.log(stack.pop()) // 3
```

**활용:** 함수 호출 스택, 브라우저 뒤로가기, 괄호 유효성 검사

---

## 큐 (Queue)

FIFO(First In, First Out) 구조.

```typescript
class Queue<T> {
  private items: T[] = []

  enqueue(item: T): void {
    this.items.push(item)
  }

  dequeue(): T | undefined {
    return this.items.shift()
  }

  front(): T | undefined {
    return this.items[0]
  }

  get size(): number {
    return this.items.length
  }
}
```

**활용:** 프린터 대기열, BFS 탐색, 이벤트 처리

---

## 연결 리스트 (Linked List)

```typescript
interface ListNode<T> {
  value: T
  next: ListNode<T> | null
}

class LinkedList<T> {
  private head: ListNode<T> | null = null
  private _size = 0

  append(value: T): void {
    const node: ListNode<T> = { value, next: null }
    if (!this.head) {
      this.head = node
    } else {
      let current = this.head
      while (current.next) current = current.next
      current.next = node
    }
    this._size++
  }

  toArray(): T[] {
    const result: T[] = []
    let current = this.head
    while (current) {
      result.push(current.value)
      current = current.next
    }
    return result
  }

  get size(): number {
    return this._size
  }
}
```

---

## 해시맵 (HashMap)

JavaScript의 `Map` 활용:

```typescript
const map = new Map<string, number>()

map.set('apple', 3)
map.set('banana', 5)
map.set('cherry', 2)

console.log(map.get('banana'))  // 5
console.log(map.has('apple'))   // true
console.log(map.size)           // 3

// 순회
for (const [key, value] of map) {
  console.log(`${key}: ${value}`)
}
```

> **평균 시간 복잡도:** 삽입 O(1), 탐색 O(1), 삭제 O(1)
