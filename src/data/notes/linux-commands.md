# 리눅스 명령어 치트시트

## 파일 & 디렉토리

```bash
ls -la              # 상세 목록 (숨김파일 포함)
pwd                 # 현재 경로
cd ~                # 홈 디렉토리
mkdir -p a/b/c      # 중간 디렉토리 포함 생성
cp -r src/ dest/    # 디렉토리 복사
mv old.txt new.txt  # 이동/이름변경
rm -rf dir/         # 강제 삭제 (주의!)
find . -name "*.log" -mtime +7  # 7일 넘은 .log 파일 찾기
```

## 텍스트 처리

```bash
cat file.txt                    # 파일 출력
grep -rn "error" ./logs/        # 재귀 검색 + 줄번호
grep -v "DEBUG" app.log         # 제외 검색
tail -f /var/log/app.log        # 실시간 로그 보기
tail -n 100 app.log             # 마지막 100줄
awk '{print $1, $3}' data.txt   # 1, 3번째 컬럼 출력
sed 's/foo/bar/g' file.txt      # 치환
wc -l file.txt                  # 줄 수 세기
sort -u data.txt                # 정렬 + 중복 제거
```

## 프로세스 관리

```bash
ps aux | grep nginx             # 프로세스 검색
top                             # 실시간 프로세스 모니터
htop                            # 향상된 top (설치 필요)
kill -9 1234                    # 강제 종료
pkill -f "node server.js"       # 프로세스 이름으로 종료
nohup node app.js &             # 백그라운드 실행 (터미널 종료 후에도 유지)
jobs                            # 백그라운드 작업 목록
```

## 네트워크

```bash
curl -X GET https://api.example.com/users
curl -X POST https://api.example.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"1234"}'

wget https://example.com/file.zip   # 파일 다운로드
netstat -tlnp                       # 포트 리스닝 현황
ss -tlnp                            # netstat 대체
lsof -i :3000                       # 3000번 포트 사용 프로세스
```

## 권한 관리

```bash
chmod 755 script.sh         # rwxr-xr-x
chmod +x script.sh          # 실행 권한 추가
chown user:group file.txt   # 소유자 변경
sudo !!                     # 이전 명령어를 sudo로 재실행
```

## 디스크 & 메모리

```bash
df -h               # 디스크 사용량
du -sh ./dist       # 특정 디렉토리 크기
free -h             # 메모리 사용량
```

## 유용한 조합

```bash
# 에러 로그만 추출해 파일로 저장
grep "ERROR" app.log | tail -100 > errors.txt

# CPU 사용률 높은 프로세스 Top 5
ps aux --sort=-%cpu | head -6

# 포트 3000 사용하는 프로세스 종료
lsof -ti :3000 | xargs kill -9
```
