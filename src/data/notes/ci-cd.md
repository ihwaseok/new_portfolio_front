# CI/CD 파이프라인

## 개요

**CI (Continuous Integration)** — 코드 변경 시 자동 빌드/테스트
**CD (Continuous Delivery/Deployment)** — 자동 배포

## GitHub Actions 기본 구조

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 의존성 설치
        run: npm ci

      - name: 타입 체크
        run: npm run type-check

      - name: 테스트 실행
        run: npm test

      - name: 빌드
        run: npm run build
```

## 배포 자동화 예시 (Vercel)

```yaml
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Vercel 배포
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 환경 변수 관리

```yaml
- name: 빌드
  run: npm run build
  env:
    VITE_API_URL: ${{ secrets.API_URL }}
    VITE_APP_ENV: production
```

## 파이프라인 단계 설계

```
코드 푸시
  ↓
Lint & 타입 체크
  ↓
단위 테스트
  ↓
빌드
  ↓
E2E 테스트 (선택)
  ↓
스테이징 배포
  ↓
승인 (Manual Gate)
  ↓
프로덕션 배포
```

> **핵심 원칙:** 파이프라인이 실패하면 배포하지 않는다. 빠른 피드백이 핵심.
