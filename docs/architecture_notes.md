# Tiny Win — Architecture Notes & Redis Caching Strategy

**Version:** MVP 1.0  
**Author:** Lead System & Database Architect  
**Goal:** Đảm bảo phản hồi API < 100 ms cho toàn bộ các endpoint cốt lõi.

---

## 1. Tổng quan kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Mobile/Web)                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS / TLS 1.3
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway / Load Balancer                  │
│   (Rate Limiting · TLS Termination · Request Routing · CORS)        │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Application Server (Node.js / Go)            │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│   │  Auth Handler │   │  Win Handler  │   │  Feed Handler    │    │
│   └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘    │
│          │                  │                     │               │
│          └──────────────────┼─────────────────────┘               │
│                             │                                      │
│              ┌──────────────▼──────────────┐                      │
│              │      Redis Cache Layer       │                      │
│              │   (Cache-Aside Pattern)      │                      │
│              └──────────────┬──────────────┘                      │
│                             │ Cache Miss                           │
│              ┌──────────────▼──────────────┐                      │
│              │     PostgreSQL (Primary)     │                      │
│              │   + Read Replica (Standby)   │                      │
│              └─────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
```

### Stack đề xuất

| Layer | Technology | Lý do |
|---|---|---|
| Application | Node.js (Fastify) hoặc Go (Gin) | Latency thấp, async I/O tốt |
| Database | PostgreSQL 16 | Đầy đủ ACID, RLS, UUID, JSONB |
| Cache | Redis 7 (cluster mode) | In-memory, Lua scripting, pub/sub |
| API Gateway | AWS API Gateway / Kong | Rate limiting, auth offload |
| ORM/Query | Prisma (Node) hoặc sqlx (Go) | Type-safe, connection pooling |
| Connection Pool | PgBouncer | Giảm overhead kết nối PostgreSQL |

---

## 2. Chiến lược Redis Caching

### 2.1 Nguyên tắc chung

- **Pattern:** Cache-Aside (Lazy Loading) — ứng dụng kiểm tra cache trước, nếu miss thì query DB rồi populate cache.
- **Serialization:** JSON (compact, human-readable, dễ debug trong Redis CLI).
- **Key convention:** `{namespace}:{scope}:{identifier}` — tất cả lowercase, dấu hai chấm phân cách.
- **Eviction policy:** `allkeys-lru` — đảm bảo Redis không OOM và ưu tiên giữ data nóng.
- **Redis persistence:** RDB snapshot mỗi 5 phút + AOF `everysec` để recovery nhanh sau restart.

---

### 2.2 Chi tiết từng Cache Key

#### 🔑 Key 1: Today's Win Status (trạng thái đã đăng hôm nay)

```
Key pattern : win:today:{user_id}:{date_key}
Example     : win:today:a1b2c3d4:2024-07-15
Value       : JSON — { "has_posted_today": true, "win_id": "...", "content": "...", ... }
TTL         : Thời gian còn lại đến hết ngày theo múi giờ user (tính bằng giây)
              ttl = seconds_until_midnight(user.timezone)
Invalidation: SET (overwrite) khi user POST /wins thành công
Write path  : POST /wins → DB INSERT → SET cache → trả response
Read path   : GET /wins/today → GET cache → (miss) → DB query → SET cache → trả response
```

**Tại sao TTL = hết ngày?** Đây là dữ liệu quan trọng nhất quyết định feed lock. Cache phải hết hạn đúng đầu ngày mới để state reset về `has_posted_today: false`.

---

#### 🔑 Key 2: Friend Feed (bảng tin bạn bè)

```
Key pattern : feed:{user_id}:{date_key}
Example     : feed:a1b2c3d4:2024-07-15
Value       : JSON — { "wins": [...], "meta": { "total": 5 } }
TTL         : 60 giây (short TTL — feed thay đổi khi bạn bè đăng bài mới)
Invalidation: DEL feed:{user_id}:{date_key} khi:
              - Một trong các bạn bè accepted của user đăng win mới
              - Một reaction thay đổi trên bất kỳ win nào trong feed (my_reaction field)
Read path   : GET /feed → kiểm tra feed lock (Key 1) → GET cache → (miss) → DB query → SET cache
```

**Tại sao TTL 60s?** Feed là dữ liệu cộng đồng, có thể stale ngắn mà không ảnh hưởng UX. TTL ngắn đảm bảo bạn bè thấy win mới trong vòng 1 phút mà không cần invalidation phức tạp.

**Fan-out invalidation:** Khi user A đăng win, pub/sub Redis gửi event `win.created:{user_a_id}`. Worker subscribe event này sẽ DEL cache feed của tất cả accepted friends của user A.

---

#### 🔑 Key 3: User Session / JWT Blocklist

```
Key pattern : auth:blocklist:{jti}          (jti = JWT ID claim)
Example     : auth:blocklist:550e8400-e29b
Value       : "1" (marker)
TTL         : Thời gian còn lại của access token (tối đa 900 giây = 15 phút)
Write path  : POST /auth/logout → INSERT blocklist key → response 204
Read path   : Middleware xác thực → kiểm tra EXISTS auth:blocklist:{jti}
```

**Tại sao không revoke ở DB?** Mỗi request đều cần kiểm tra token validity. Redis O(1) GET nhanh hơn DB query 100×. Với access token TTL 15 phút, blocklist tự dọn qua Redis TTL.

---

#### 🔑 Key 4: Refresh Token Store

```
Key pattern : auth:refresh:{user_id}:{token_hash}
Example     : auth:refresh:a1b2c3d4:sha256hash
Value       : JSON — { "user_id": "...", "issued_at": "...", "expires_at": "..." }
TTL         : 30 ngày (2,592,000 giây)
Invalidation: DEL khi logout hoặc khi phát hiện token reuse (rotation)
```

---

#### 🔑 Key 5: Streaks (streak counters)

```
Key pattern : streak:{user_id}
Example     : streak:a1b2c3d4
Value       : JSON — { "current_streak": 7, "longest_streak": 14, "total_wins": 42, "last_win_date": "2024-07-15" }
TTL         : 300 giây (5 phút)
Invalidation: DEL streak:{user_id} khi user POST /wins thành công (trigger fn_update_streak đã cập nhật DB)
Read path   : GET /users/{id}/streaks → GET cache → (miss) → DB query → SET cache
```

---

#### 🔑 Key 6: Win Calendar (tháng)

```
Key pattern : calendar:{user_id}:{year}:{month}
Example     : calendar:a1b2c3d4:2024:7
Value       : JSON — { "days": ["2024-07-01", "2024-07-05", ...] }
TTL         : 600 giây (10 phút) cho tháng hiện tại; 3600 giây cho tháng quá khứ
Invalidation: DEL calendar:{user_id}:{year}:{month} khi user POST /wins thành công trong tháng đó
Read path   : GET /users/{id}/calendar → GET cache → (miss) → DB query → SET cache
```

---

#### 🔑 Key 7: Idempotency Key Store (chống double-submit)

```
Key pattern : idempotency:win:{idempotency_key}
Example     : idempotency:win:550e8400-e29b-41d4-a716-446655440000
Value       : JSON — { "status": "created", "win_id": "...", "response_body": {...} }
TTL         : 86400 giây (24 giờ — đủ để cover một chu kỳ ngày)
Write path  : Trước khi INSERT win → SET NX idempotency key (atomic check-and-set)
              Nếu key đã tồn tại → trả cached response ngay, không query DB
Read path   : POST /wins → GET idempotency key → (exists) → return 200 + cached body
                                               → (not exists) → DB INSERT → SET key
```

**Lưu ý atomic:** Dùng Redis `SET key value NX EX ttl` (single atomic command) để tránh race condition giữa check và set.

---

#### 🔑 Key 8: Rate Limiting (bảo vệ API)

```
Key pattern : ratelimit:{endpoint_slug}:{user_id_or_ip}:{window_minute}
Example     : ratelimit:post_win:a1b2c3d4:202407150930
Value       : Integer counter (INCR)
TTL         : 60 giây (sliding window per minute)
Strategy    : Fixed window counter — INCR + EXPIRE
              Limit: POST /wins: 5 req/min; GET /feed: 30 req/min; auth: 10 req/min
```

---

### 2.3 Tóm tắt tất cả Redis Keys

| # | Key Pattern | TTL | Mục đích |
|---|---|---|---|
| 1 | `win:today:{user_id}:{date_key}` | Hết ngày (user tz) | Trạng thái đã đăng, feed lock check |
| 2 | `feed:{user_id}:{date_key}` | 60 giây | Cache bảng tin bạn bè |
| 3 | `auth:blocklist:{jti}` | TTL token còn lại | JWT revocation |
| 4 | `auth:refresh:{user_id}:{token_hash}` | 30 ngày | Refresh token store |
| 5 | `streak:{user_id}` | 5 phút | Streak counters |
| 6 | `calendar:{user_id}:{year}:{month}` | 10 phút / 1 giờ | Calendar heatmap |
| 7 | `idempotency:win:{idempotency_key}` | 24 giờ | Chống double-submit POST /wins |
| 8 | `ratelimit:{slug}:{id}:{window}` | 60 giây | Rate limiting per endpoint |

---

## 3. Đảm bảo API < 100 ms — Phân tích từng endpoint

### 3.1 Mục tiêu latency

| Endpoint | P50 Target | P99 Target |
|---|---|---|
| `POST /auth/login` | < 50 ms | < 150 ms |
| `GET /wins/today` | < 20 ms | < 50 ms |
| `POST /wins` | < 60 ms | < 120 ms |
| `GET /feed` | < 30 ms | < 80 ms |
| `PUT /wins/{id}/reaction` | < 40 ms | < 100 ms |
| `DELETE /wins/{id}/reaction` | < 30 ms | < 80 ms |
| `GET /users/{id}/streaks` | < 20 ms | < 50 ms |
| `GET /users/{id}/calendar` | < 20 ms | < 50 ms |

### 3.2 Chiến lược tối ưu theo từng tầng

#### Tầng Database (PostgreSQL)

1. **Index coverage:** Mọi query hot path đều có covering index (xem `schema.sql`).
   - `idx_wins_author_date` → query `date_key = today AND author_id = ?` không cần seq scan.
   - `idx_wins_date_key` → build friend feed: `date_key = today AND author_id IN (friend_ids)`.
   - `idx_reactions_win` → load reactions cho một win.
   - `idx_friendships_accepted` → partial index, chỉ index hàng `status = 'accepted'`.

2. **Connection Pooling (PgBouncer):**
   - Chế độ: Transaction pooling.
   - Pool size: 20 connections (tuỳ scale).
   - Giảm overhead mở/đóng kết nối từ ~10 ms → < 1 ms.

3. **Read Replica:** Feed query và calendar query đọc từ replica.
   - Primary: chỉ nhận INSERT/UPDATE/DELETE.
   - Replica: tất cả SELECT.
   - Replication lag < 10 ms trong cùng AZ.

4. **Query optimization:**
   - Feed query dùng `ANY($1::uuid[])` thay vì JOIN để pass danh sách friend IDs.
   - `EXPLAIN ANALYZE` mọi query mới trước khi deploy.
   - `pg_stat_statements` để monitor slow queries.

5. **Giới hạn kết quả:** Feed luôn có `LIMIT` (mặc định 20), tránh full-table result.

#### Tầng Cache (Redis)

1. **Cache Hit Rate mục tiêu:** > 90% cho `GET /wins/today` và `GET /feed`.
2. **Pipeline:** Batch multiple Redis commands trong một round-trip khi có thể.
3. **Connection pool:** Dùng Redis connection pool (ioredis / go-redis), không tạo connection mới mỗi request.
4. **Local in-process cache (L1):** Với data cực hot và ít thay đổi (e.g., user timezone), dùng LRU in-memory cache trong process (Node: `lru-cache`), TTL 30 giây. Redis là L2.

#### Tầng Application

1. **Async I/O:** Không block event loop. Redis + DB calls đều async/await.
2. **Parallel queries:** Khi cần cả streak lẫn win status → `Promise.all([...])` thay vì sequential.
3. **Response compression:** Gzip/Brotli ở API gateway cho response > 1 KB.
4. **Keep-alive connections:** HTTP/2 + keep-alive giữa client và gateway, gateway và app server.

---

## 4. Luồng xử lý POST /wins (critical path)

Đây là endpoint quan trọng nhất về correctness và idempotency.

```
Client gửi POST /wins
│
├─1. API Gateway: Rate limit check (Redis INCR, < 1 ms)
│
├─2. App: JWT validate (local verify, không cần DB/Redis, < 1 ms)
│
├─3. App: GET idempotency:win:{idempotency_key} từ Redis
│   ├── HIT  → trả cached response (HTTP 200), STOP. Total: ~5 ms
│   └── MISS → tiếp tục
│
├─4. App: GET win:today:{user_id}:{date_key} từ Redis
│   ├── HIT + has_posted_today=true → trả 409 WIN_ALREADY_EXISTS. Total: ~8 ms
│   └── MISS hoặc has_posted_today=false → tiếp tục
│
├─5. DB: BEGIN TRANSACTION
│   ├── SELECT 1 FROM wins WHERE author_id=? AND date_key=? (idx_wins_author_date)
│   │   ├── EXISTS → ROLLBACK → trả 409 (race condition guard)
│   │   └── NOT EXISTS → tiếp tục
│   ├── INSERT INTO wins (...) VALUES (...)  [constraint: UNIQUE(author_id, date_key)]
│   └── COMMIT
│
├─6. Redis: Pipeline (atomic batch)
│   ├── SET win:today:{user_id}:{date_key} {json} EX {ttl_until_midnight}
│   ├── SET idempotency:win:{key} {response_json} EX 86400
│   ├── DEL feed:{user_id}:{date_key}        (invalidate own feed cache)
│   └── DEL streak:{user_id}                 (invalidate streak cache)
│
├─7. Pub/Sub: PUBLISH win.created {user_id}  (fan-out feed invalidation cho friends)
│
└─8. Trả HTTP 201 với win object
```

**Thời gian ước tính:** Steps 1-4 (cache hits) ~8 ms; Steps 5-8 (DB write path) ~40-60 ms.

---

## 5. Luồng kiểm tra Feed Lock (GET /feed)

```
Client gửi GET /feed
│
├─1. JWT validate (< 1 ms)
│
├─2. Redis GET win:today:{user_id}:{date_key}
│   ├── HIT + has_posted_today=true  → tiếp tục load feed
│   ├── HIT + has_posted_today=false → trả 403 FEED_LOCKED. Total: ~5 ms
│   └── MISS → DB query wins WHERE author_id=? AND date_key=?
│               → SET cache → xử lý tiếp
│
├─3. (Nếu unlocked) Redis GET feed:{user_id}:{date_key}
│   ├── HIT → trả response ngay. Total: ~10 ms
│   └── MISS → DB query:
│              SELECT w.*, u.username, r.type as my_reaction
│              FROM wins w
│              JOIN users u ON u.id = w.author_id
│              LEFT JOIN reactions r ON r.win_id = w.id AND r.user_id = {me}
│              WHERE w.author_id = ANY({friend_ids})
│                AND w.date_key = {today}
│              ORDER BY w.created_at DESC
│              LIMIT 20
│              → SET feed:{user_id}:{date_key} EX 60
│              → trả response. Total: ~30-50 ms
```

---

## 6. Monitoring & Observability

### 6.1 Key Metrics cần theo dõi

| Metric | Tool | Alert threshold |
|---|---|---|
| API P99 latency | Prometheus + Grafana | > 200 ms |
| Redis cache hit rate | Redis INFO stats | < 80% |
| DB query time P99 | pg_stat_statements | > 50 ms |
| DB connection pool utilization | PgBouncer stats | > 80% |
| Redis memory usage | Redis INFO memory | > 80% max |
| Error rate (5xx) | Prometheus | > 1% |
| Feed lock bypass attempts | Application logs | > 0 |

### 6.2 Structured Logging

Mỗi request log bao gồm:

```json
{
  "timestamp": "2024-07-15T07:32:00.123Z",
  "request_id": "uuid",
  "user_id": "uuid",
  "method": "POST",
  "path": "/v1/wins",
  "status": 201,
  "latency_ms": 47,
  "cache_hit": false,
  "db_query_count": 2,
  "db_time_ms": 12
}
```

**Quan trọng:** KHÔNG log `content` của Tiny Win vào system logs (PRD §8 — "Không ghi nội dung Tiny Win vào log phân tích").

### 6.3 Health Check Endpoint

```
GET /health
→ 200 OK: { "status": "ok", "db": "ok", "redis": "ok", "version": "1.0.0" }
→ 503 Service Unavailable: { "status": "degraded", "db": "ok", "redis": "error" }
```

---

## 7. Security Considerations

### 7.1 TLS
- Toàn bộ traffic client ↔ server qua HTTPS / TLS 1.3.
- Certificate pinning khuyến khích cho mobile client.

### 7.2 Token Security
- Access token: JWT RS256, TTL 15 phút.
- Refresh token: opaque random string (crypto.randomBytes(64)), hashed khi lưu.
- Logout: revoke refresh token + add JTI vào blocklist Redis.

### 7.3 Input Validation
- Trim và validate `content` ở cả client và server.
- Đếm ký tự theo Unicode grapheme clusters (không phải UTF-16 code units) — dùng `Intl.Segmenter` (JS) hoặc `unicode/utf8` (Go).
- Reject nội dung chỉ gồm whitespace trước khi INSERT.

### 7.4 Row Level Security
- PostgreSQL RLS bật trên `wins`, `reactions`, `friendships` (xem `schema.sql`).
- App set `app.current_user_id` per request qua `SET LOCAL`.
- Ngay cả SQL injection cũng không thể bypass RLS (defense in depth).

### 7.5 Feed Lock Server Enforcement
- Feed lock PHẢI kiểm tra ở server — không chỉ ẩn UI phía client (PRD §5, Rule #10-12).
- `GET /feed` luôn gọi Redis key 1 để verify, không trust header hay client claim.

---

## 8. Scalability Plan (post-MVP)

| Bottleneck | Solution |
|---|---|
| Feed query chậm khi user có nhiều bạn | Pre-compute feed lúc win được tạo (fan-out on write) |
| Redis single node | Redis Cluster (6 nodes: 3 primary + 3 replica) |
| PostgreSQL write pressure | Horizontal sharding theo user_id hash |
| Streak computation chậm | Batch job nightly thay vì trigger đồng bộ |
| Notification fan-out | Message queue (SQS/RabbitMQ) thay vì Redis pub/sub |

---

## 9. Tổng kết

Chiến lược caching Redis của Tiny Win MVP được thiết kế theo nguyên tắc:

1. **Cache what's hot:** `win:today` và `feed` là hai key được đọc nhiều nhất — cache first.
2. **Short TTL cho feed:** 60 giây đảm bảo freshness mà không cần invalidation phức tạp.
3. **Precise TTL cho today-status:** Hết hạn chính xác đầu ngày (user timezone) để reset feed lock.
4. **Idempotency in Redis:** Atomic `SET NX` cho phép chống double-submit không cần distributed lock.
5. **Blocklist > Stateful tokens:** JWT blocklist trong Redis đơn giản hơn stateful session.
6. **Monitor everything:** Cache hit rate, query time, connection pool — alert trước khi user thấy chậm.

Với kiến trúc này, > 90% requests sẽ được phục vụ từ Redis (< 10 ms), chỉ cache miss mới xuống DB (< 60 ms), đảm bảo P99 toàn hệ thống dưới mục tiêu 100 ms.
