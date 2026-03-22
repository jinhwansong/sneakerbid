# LaceUp / SneakerBid — Frontend (Next.js)

App Router 기반 스니커즈 경매 UI. 백엔드 Nest API와 쿠키·CORS로 연동합니다.

## 요구 사항

- Node.js 20+ 권장
- 동작 중인 **백엔드 API** (`../backend`)

## 빠른 시작

```bash
cd frontend
npm install
```

`.env.local` (또는 `.env`) 생성:

```env
# 브라우저·클라이언트에서 호출할 API 베이스 URL (끝 슬래시 없음)
NEXT_PUBLIC_SITE_URL=http://localhost:3030
```

로컬에서 백엔드를 3030으로 띄운 경우 위와 같이 맞춥니다.

```bash
npm run dev
```

브라우저: [http://localhost:3000](http://localhost:3000)

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | **API 베이스 URL** (프론트 페이지 주소가 아님). `fetch` / `apiClient`가 `GET ${NEXT_PUBLIC_SITE_URL}/auctions/...` 형태로 호출합니다. |
| `API_URL` | 선택 | **서버 컴포넌트**에서 백엔드로 직접 요청할 때 사용. 설정하고 요청 시 브라우저 쿠키를 전달하려면 코드에서 `Cookie` 헤더를 붙이는 경로와 함께 씁니다 (`app/(home)/page.tsx` 등). |

### 배포 예시

| 구성 | `NEXT_PUBLIC_SITE_URL` | 비고 |
|------|------------------------|------|
| 로컬 Next + 로컬 API | `http://localhost:3030` | 백엔드 포트에 맞출 것 |
| Vercel + API를 `https://api.example.com` | `https://api.example.com` | |
| Vercel + Nginx로 같은 도메인에 API 프록시 | `https://example.com` | `/auth`, `/auctions` 등이 API로 프록시되는 그 Origin |

**주의:** `NEXT_PUBLIC_SITE_URL`에 Vercel 앱 URL만 넣고 API가 다른 곳이면, 요청이 Next 자기 자신으로 가서 실패합니다.

### 크로스 도메인 (Vercel ↔ 별도 API 도메인)

- 백엔드에 `FRONTEND_URL=https://xxx.vercel.app` 정확히 설정
- 백엔드에 `AUTH_COOKIE_SAME_SITE=none` 및 **HTTPS API**  
  → 자세한 설명은 [backend README](../backend/README.md#인증--cors--쿠키)

검증:

```bash
npm run env:validate
```

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 (`build` 후) |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test` / `test:run` | Vitest |
| `npm run test:e2e` | Playwright E2E (백엔드 `http://localhost:3030` 동작 필요) |
| `npm run test:e2e:ui` | Playwright UI 모드 |
| `npm run env:validate` | 필수 env 확인 |

## API 클라이언트

- `lib/api/client.ts` — 경로만 넘기면 `NEXT_PUBLIC_SITE_URL` 기준으로 요청
- `lib/util/fetcher.ts` — `credentials: 'include'`, 401 시 `/auth/refresh` 재시도 (refresh URL도 `NEXT_PUBLIC_SITE_URL` 기준)

## 백엔드 저장소

같은 모노레포의 `../backend` — 마이그레이션·OAuth·Redis 설정은 백엔드 README를 따릅니다.

## Vercel 배포

1. 프로젝트 루트를 `frontend`로 두거나 서브디렉터리 빌드 설정
2. Environment Variables에 `NEXT_PUBLIC_SITE_URL` 등 등록
3. OAuth 리다이렉트 URI는 **실제 콜백을 받는 백엔드 URL** 기준으로 Google/Kakao 콘솔에 등록

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
