# REST API 설계 원칙

## URI 설계 규칙

```
# 좋은 예
GET    /api/users           # 목록
GET    /api/users/123       # 단건
POST   /api/users           # 생성
PUT    /api/users/123       # 전체 수정
PATCH  /api/users/123       # 부분 수정
DELETE /api/users/123       # 삭제

# 나쁜 예 (동사 사용 금지)
GET /api/getUsers
POST /api/createUser
GET /api/users/delete/123
```

## HTTP 상태 코드

| 코드 | 의미 | 사용 상황 |
|------|------|-----------|
| 200 | OK | 조회, 수정 성공 |
| 201 | Created | 생성 성공 |
| 204 | No Content | 삭제 성공 |
| 400 | Bad Request | 잘못된 요청 데이터 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복 데이터 |
| 500 | Internal Server Error | 서버 오류 |

## 응답 구조 표준화

```json
// 성공
{
  "success": true,
  "data": {
    "id": 1,
    "name": "홍길동"
  },
  "meta": {
    "total": 100,
    "page": 1,
    "perPage": 20
  }
}

// 에러
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "사용자를 찾을 수 없습니다.",
    "details": []
  }
}
```

## 페이지네이션

```
# 오프셋 기반
GET /api/posts?page=2&limit=20

# 커서 기반 (대용량 데이터에 적합)
GET /api/posts?cursor=eyJpZCI6MTAwfQ&limit=20
```

## 버전 관리

```
# URI 버전 (권장)
GET /api/v1/users
GET /api/v2/users

# 헤더 버전
GET /api/users
Accept: application/vnd.api+json;version=1
```

## 필터링 & 정렬

```
GET /api/products?category=electronics&minPrice=10000&maxPrice=50000
GET /api/users?sort=createdAt:desc,name:asc
GET /api/posts?fields=id,title,author
```
