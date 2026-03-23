# LaceUp / SneakerBid — Backend (NestJS)

스니커즈 경매 API. PostgreSQL(Supabase), Redis(리프레시 토큰), RS256 JWT, OAuth(Google/Kakao).

## 요구 사항

- Node.js 20+ 권장
- PostgreSQL (Supabase 권장)
- Redis (로컬 또는 Upstash 등)

## 빠른 시작

```bash
cd backend
npm install
# 루트에 .env 생성 (아래 표 참고)
```

DB에 `supabase/migrations/` 아래 SQL을 **순서대로** 적용한 뒤:

```bash
npm run start:dev
```

기본 포트는 `.env`의 `PORT` (미설정 시 Nest 기본값 참고).

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `NODE_ENV` | 권장 | `production`일 때 쿠키 `Secure` 등 프로덕션 동작. `start:prod`에서 설정됨. |
| `PORT` | ✅ | HTTP 포트 (예: `3030`) |
| `APP_NAME` | ✅ | Swagger 제목 등 |
| `DATABASE_URL` | ✅ | Postgres 연결 문자열 (트랜잭션용 `pg` Pool) |
| `SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role 키 |
| `JWT_PRIVATE_KEY` | ✅ | RS256 개인키 (PEM, `.env`에서는 `\n` 이스케이프) |
| `JWT_PUBLIC_KEY` | ✅ | RS256 공개키 |
| `REDIS_URL` | 권장 | 리프레시 토큰 저장. 없으면 Redis 모듈 동작 방식 확인 필요 |
| `FRONTEND_URL` | ✅ (프로덕션) | **정확한 Origin** (예: `https://sneakerbid.vercel.app`). CORS `origin`에 사용 |
| `CORS_ORIGIN` | 선택 | 없으면 `FRONTEND_URL`로 대체 |
| `AUTH_COOKIE_SAME_SITE` | 선택 | `lax` \| `strict` \| `none`. 프론트·API **도메인이 다르면** `none` + HTTPS |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | OAuth 시 | 콜백 URL은 배포된 API 도메인 기준 |
| `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` / `KAKAO_CALLBACK_URL` | OAuth 시 | 동일 |
| `KICKS_API_KEY` | 선택 | KicksDB API 키. 없으면 상품 시드 Cron 스킵 (매일 00:00, 12:00) |

검증 스크립트:

```bash
npm run env:validate
```

## 데이터베이스 마이그레이션

이 프로젝트는 **Prisma migrate가 아닌** `supabase/migrations/*.sql`을 사용합니다.

**순서 (같은 DB·같은 Supabase 프로젝트에 적용):**

1. `001_init.sql` — 전체 스키마 (`"Auction"` 등 테이블 생성). **이걸 안 하면 `003`에서 relation 없음 오류**
2. `002_add_bot_enabled.sql`
3. `003_auction_post_close_finalize_payload.sql`

- Supabase Dashboard → **SQL Editor**에서 위 순서로 실행 (또는 `supabase db push` 등)
- `DATABASE_URL`이 가리키는 프로젝트와 SQL을 실행하는 프로젝트가 **동일한지** 확인

스키마 변경 시 새 번호의 SQL 파일을 추가합니다.

## Redis (Upstash 예시)

- Upstash Console → Redis → **Connect** 에서 URL 복사
- `REDIS_URL=rediss://default:...@....upstash.io:6379` (`rediss` = TLS)

## Supabase Storage (이미지 업로드)

- Storage에 `uploads` 버킷 생성 후 **Public**으로 설정 (직링크용)
- `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## 인증 · CORS · 쿠키

- JWT는 **헤더 Bearer** 또는 **쿠키 `accessToken`** 으로 전달 (`passport-jwt` 커스텀 extractor).
- 리프레시는 **httpOnly 쿠키 `refreshToken`** + Redis.
- `main.ts`: `credentials: true` CORS, `origin`은 **`FRONTEND_URL` 단일 값** — 브라우저에서 접속하는 주소와 **완전히 일치**해야 함 (`www` 유무 포함).
- **프론트와 API 호스트가 다를 때** (예: Vercel + 자체 도메인 API):  
  `AUTH_COOKIE_SAME_SITE=none`  
  이때 쿠키는 **`Secure` 필수**이므로 API는 **HTTPS**여야 합니다.

## 프로덕션 실행

```bash
npm run build
npm run start:prod
```

`start:prod`는 `NODE_ENV=production`을 포함합니다. 리버스 프록시(Nginx 등) 뒤에서는 `X-Forwarded-Proto` 전달을 권장합니다 (`trust proxy` 설정됨).

## 시드 데이터

```bash
npm run seed
```

`DATABASE_URL` 필요. 진행 중 경매·봇·스니커 샘플을 넣습니다. **중복 실행 시 PK 충돌**할 수 있으니 개발 DB 위주로 사용하세요.

## 테스트

```bash
npm run test
npm run test:e2e
```

**E2E (CI)**  
`test:e2e`는 실제 DB/Redis 연결이 필요합니다. GitHub Actions에서 실행하려면 Secrets에 `DATABASE_URL` 등을 설정하세요.

- `DATABASE_URL`: Supabase Dashboard → **Settings → Database** → Connection string (URI) 전체 복사  
  - 형식 예: `postgresql://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres`  
  - `getaddrinfo EAI_AGAIN base` 오류 시: hostname이 잘못됨. URL 전체가 올바른지 확인

## API 문서

앱 기동 후 (기본 경로 기준): `/api` — Swagger UI.

## 모노레포

프론트엔드는 상위 디렉터리 `../frontend` — 환경 변수·배포 연동은 [frontend README](../frontend/README.md) 참고.

## 라이선스

Private / 포트폴리오 용도에 맞게 프로젝트 루트 정책을 따릅니다.
