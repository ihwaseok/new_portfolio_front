# JavaScript 핵심 개념

## 클로저 (Closure)

함수가 선언될 때의 렉시컬 환경을 기억하는 것.

```javascript
function makeCounter(initial = 0) {
  let count = initial

  return {
    increment() { count++ },
    decrement() { count-- },
    getCount() { return count },
  }
}

const counter = makeCounter(10)
counter.increment()
counter.increment()
console.log(counter.getCount()) // 12
```

## 프로토타입 체인

```javascript
function Animal(name) {
  this.name = name
}

Animal.prototype.speak = function() {
  return `${this.name}이/가 소리를 냅니다.`
}

function Dog(name) {
  Animal.call(this, name)
}

Dog.prototype = Object.create(Animal.prototype)
Dog.prototype.bark = function() {
  return `${this.name}: 멍멍!`
}

const dog = new Dog('바둑이')
console.log(dog.speak())  // 바둑이이/가 소리를 냅니다.
console.log(dog.bark())   // 바둑이: 멍멍!
```

## 이벤트 루프

```javascript
console.log('1')  // 동기

setTimeout(() => {
  console.log('2')  // 매크로태스크
}, 0)

Promise.resolve().then(() => {
  console.log('3')  // 마이크로태스크
})

console.log('4')  // 동기

// 출력 순서: 1, 4, 3, 2
```

**실행 순서:** 동기 → 마이크로태스크 → 매크로태스크

## 구조분해 할당

```javascript
// 배열
const [first, second, ...rest] = [1, 2, 3, 4, 5]

// 객체
const { name, age = 20, address: { city } = {} } = user

// 함수 파라미터
function greet({ name, greeting = '안녕하세요' }) {
  return `${greeting}, ${name}님!`
}
```

## 옵셔널 체이닝 & Nullish 병합

```javascript
const user = {
  profile: {
    avatar: null
  }
}

// 옵셔널 체이닝
const avatarUrl = user?.profile?.avatar?.url ?? '/default-avatar.png'

// Nullish 병합 (null, undefined만 처리 — falsy와 다름)
const count = user.count ?? 0     // null/undefined면 0
const title = user.title || '제목 없음'  // falsy면 기본값
```

## 비동기 패턴

```javascript
// Promise 체이닝
fetch('/api/users')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))

// async/await (권장)
async function getUsers() {
  try {
    const res = await fetch('/api/users')
    const data = await res.json()
    return data
  } catch (err) {
    console.error('에러:', err)
    throw err
  }
}

// 병렬 처리
const [users, posts] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
])
```
