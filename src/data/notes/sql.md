# SQL 기초 쿼리

## SELECT

```sql
-- 전체 조회
SELECT * FROM users;

-- 특정 컬럼
SELECT id, name, email FROM users;

-- 조건 조회
SELECT * FROM users WHERE age >= 20 AND active = true;

-- 정렬
SELECT * FROM users ORDER BY created_at DESC;

-- 페이징
SELECT * FROM users LIMIT 10 OFFSET 20;
```

## JOIN

```sql
-- INNER JOIN
SELECT
  u.name,
  o.order_date,
  o.total_amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE u.id = 1;

-- LEFT JOIN (없는 것도 포함)
SELECT
  u.name,
  COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

## 집계함수

```sql
SELECT
  department,
  COUNT(*) as 직원수,
  AVG(salary) as 평균급여,
  MAX(salary) as 최고급여
FROM employees
GROUP BY department
HAVING COUNT(*) > 5
ORDER BY 평균급여 DESC;
```

## 인덱스

```sql
-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);

-- 복합 인덱스
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);

-- 인덱스 확인
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```
