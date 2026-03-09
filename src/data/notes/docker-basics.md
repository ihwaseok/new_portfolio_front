# Docker 기초

## 핵심 개념

| 용어 | 설명 |
|------|------|
| Image | 컨테이너 실행을 위한 읽기 전용 템플릿 |
| Container | 이미지를 실행한 인스턴스 |
| Dockerfile | 이미지 빌드 설명서 |
| Registry | 이미지 저장소 (Docker Hub 등) |

## 자주 쓰는 명령어

```bash
# 이미지 관련
docker pull nginx              # 이미지 다운로드
docker images                  # 로컬 이미지 목록
docker rmi nginx               # 이미지 삭제
docker build -t my-app:1.0 .  # 이미지 빌드

# 컨테이너 실행
docker run -d -p 8080:80 --name my-nginx nginx
docker run -it ubuntu bash     # 인터랙티브 모드

# 컨테이너 관리
docker ps                      # 실행 중인 컨테이너
docker ps -a                   # 전체 컨테이너
docker stop my-nginx
docker rm my-nginx
docker logs my-nginx
docker exec -it my-nginx bash  # 컨테이너 내부 접속
```

## Dockerfile 작성

```dockerfile
# Node.js 앱 예시
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker compose up -d      # 백그라운드 실행
docker compose down       # 중지 및 컨테이너 삭제
docker compose logs -f    # 로그 실시간 확인
```

## 레이어 캐시 최적화

```dockerfile
# 나쁜 예: 코드 변경 시 npm install 재실행
COPY . .
RUN npm install

# 좋은 예: 의존성 레이어 캐시 활용
COPY package*.json ./
RUN npm install
COPY . .
```

> **Tip:** 변경이 적은 레이어를 위에, 자주 변경되는 레이어를 아래에 배치하면 빌드 속도가 크게 향상됩니다.
