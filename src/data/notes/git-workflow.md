# Git 협업 워크플로우

## Git Flow 전략

```
main        ──●────────────────────────●──
              │                        │
develop     ──●──────────●─────────────●──
              │          │
feature     ──●──●──●────┘
```

| 브랜치 | 역할 |
|--------|------|
| `main` | 배포 가능한 안정 버전 |
| `develop` | 다음 릴리즈 통합 브랜치 |
| `feature/*` | 기능 개발 |
| `hotfix/*` | 긴급 버그 수정 |
| `release/*` | 릴리즈 준비 |

## 기본 명령어

```bash
# 브랜치 작업
git checkout -b feature/login    # 브랜치 생성 + 이동
git branch -d feature/login      # 브랜치 삭제

# 원격 동기화
git fetch origin                 # 원격 변경사항 가져오기
git pull origin develop          # fetch + merge
git push origin feature/login    # 원격에 푸시

# 되돌리기
git revert HEAD                  # 커밋 취소 (이력 남김)
git reset --soft HEAD~1          # 커밋만 취소
git stash                        # 임시 저장
git stash pop                    # 꺼내기
```

## 커밋 메시지 컨벤션

```
<type>(<scope>): <subject>

[body]

[footer]
```

**type 종류:**
- `feat` — 새 기능
- `fix` — 버그 수정
- `docs` — 문서 변경
- `style` — 코드 포맷 변경
- `refactor` — 리팩토링
- `test` — 테스트 추가/수정
- `chore` — 빌드, 설정 변경

```bash
# 예시
git commit -m "feat(auth): 소셜 로그인 카카오 추가"
git commit -m "fix(payment): 결제 금액 소수점 오류 수정"
```

## Pull Request 체크리스트

- [ ] 브랜치명이 컨벤션을 따르는가
- [ ] 불필요한 파일이 포함되지 않았는가 (.env 등)
- [ ] 테스트를 작성했는가
- [ ] 셀프 리뷰를 했는가
- [ ] 충돌이 없는가

## 유용한 alias 설정

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --decorate"
```
