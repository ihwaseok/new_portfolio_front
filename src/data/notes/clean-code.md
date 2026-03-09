# 클린 코드

**저자:** 로버트 C. 마틴 (Robert C. Martin)
**읽은 기간:** 2024년 2월

## 핵심 내용

### 의미 있는 이름
- 의도를 분명히 밝혀라
- 그릇된 정보를 피하라
- 의미 있게 구분하라
- 발음하기 쉬운 이름을 사용하라

```javascript
// 나쁜 예
const d = new Date()
const ymdstr = moment(d).format('YYYY/MM/DD')

// 좋은 예
const currentDate = new Date()
const formattedDate = moment(currentDate).format('YYYY/MM/DD')
```

### 함수
- 작게 만들어라
- 한 가지만 해라
- 서술적인 이름을 사용하라
- 함수 인수는 적을수록 좋다

### 주석
> 나쁜 코드에 주석을 달지 마라. 새로 짜라.
> — Brian W. Kernighan, P.J. Plaugher

- 코드로 의도를 표현하라
- 좋은 주석: 법적 주석, 의도 설명, TODO

## 인상 깊은 구절

> "깨끗한 코드는 단순하고 직접적이다. 깨끗한 코드는 잘 쓴 산문처럼 읽힌다."

## 평점
⭐⭐⭐⭐⭐ (5/5)
