# CSS Grid 레이아웃

## 기본 개념

CSS Grid는 2차원 레이아웃 시스템입니다.

## 컨테이너 속성

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 16px;
}
```

## 자주 쓰는 패턴

### 12컬럼 그리드

```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

.col-6 { grid-column: span 6; }
.col-4 { grid-column: span 4; }
.col-3 { grid-column: span 3; }
```

### Holy Grail 레이아웃

```css
.layout {
  display: grid;
  grid-template:
    "header header header" 60px
    "nav    main   aside " 1fr
    "footer footer footer" 60px
    / 200px  1fr    200px;
}

header { grid-area: header; }
nav    { grid-area: nav; }
main   { grid-area: main; }
aside  { grid-area: aside; }
footer { grid-area: footer; }
```

## Grid vs Flexbox

| | Grid | Flexbox |
|---|---|---|
| 차원 | 2차원 | 1차원 |
| 용도 | 전체 레이아웃 | 컴포넌트 정렬 |
| 방향 | 행+열 동시 | 행 또는 열 |

> 실무에서는 Grid와 Flexbox를 함께 사용합니다. Grid로 전체 레이아웃을, Flexbox로 세부 컴포넌트를 정렬하세요.
