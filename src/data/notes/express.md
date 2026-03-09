# Express.js 기초

## 설치

```bash
npm install express
npm install -D @types/express typescript
```

## 기본 서버

```typescript
import express from 'express'

const app = express()
const PORT = 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
```

## REST API 구조

```typescript
// GET 목록 조회
app.get('/api/users', async (req, res) => {
  const users = await UserService.findAll()
  res.json(users)
})

// GET 단건 조회
app.get('/api/users/:id', async (req, res) => {
  const user = await UserService.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})

// POST 생성
app.post('/api/users', async (req, res) => {
  const user = await UserService.create(req.body)
  res.status(201).json(user)
})
```

## 미들웨어

```typescript
// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// 에러 핸들러
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})
```
