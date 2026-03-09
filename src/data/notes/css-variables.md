# CSS 변수 (Custom Properties)

## 선언과 사용

```css
:root {
  --color-primary: #5b8ee6;
  --color-text: #333333;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --border-radius: 4px;
}

.button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
}
```

## 다크모드 구현

```css
:root {
  --bg: #ffffff;
  --text: #333333;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1e1e1e;
    --text: #cccccc;
  }
}

body {
  background-color: var(--bg);
  color: var(--text);
}
```

## JavaScript에서 조작

```javascript
// 읽기
const primary = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary')

// 쓰기
document.documentElement.style.setProperty('--color-primary', '#ff6600')
```

## 폴백 값

```css
.box {
  /* --custom-size가 없으면 16px 사용 */
  font-size: var(--custom-size, 16px);
}
```
