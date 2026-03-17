# 작업 관리

> 작업순위·추가작업·보안 항목 정리 (백엔드/프론트 분리)

---

## 📋 미구현 항목 요약 (체크리스트)

| 구분 | 항목 | Backend | Frontend |
|------|------|---------|----------|
| 경매 등록 | UI 및 API 연동 | ✅ API 있음 | ✅ 완료 |
| 경매 등록 목록 | API | ✅ 완료 | ✅ 완료 |
| 찜하기 | API + UI | ✅ 완료 | ✅ 완료 |
| 찜 목록 페이지 | /me/wishlist | - | ✅ 완료 |
| 메인 FeaturedAuction | SSE 실시간 갱신 | ✅ | ✅ 완료 |
| 메인 MainAuctionSection | SSE 실시간 갱신 | ✅ | ✅ 완료 |
| LiveStats | 실시간 지표 | ✅ 완료 | ✅ 완료 |
| 관리자 페이지 | 전체 | ✅ 완료 | ✅ 완료 |
| 경매 수정 | MyAuctionCard | ✅ API 있음 | ✅ 완료 |

---

## 🚨 Critical (배포 전 필수)

### Backend
- [x] SSE Redis Pub/Sub *(완료)*
- [x] payOrder 조건부 상태 전환 보장 (이중 결제 방지) *(완료)*
- [x] PENDING 주문 타임아웃 Cron *(3일 초과 시 유찰 처리)* *(완료)*
- [x] 결제 실패 시 Auction REOPEN *(완료)*

### Frontend
- [x] SSE 재연결(backoff) *(완료)*
- [x] 입찰 실패 UX 개선 *(완료: error 토스트, 흔들림 애니메이션, 아이콘)*

---

## ⚙️ Important (완성도 상승)

### Backend
- [x] 경매 종료 전용 이벤트 (auctionClosed)
- [x] 봇 시뮬레이션 개선 (per-auction cooldown 등)
- [x] EventsService 구독 0일 때 Subject 정리
- [x] closeExpiredAuctions 배치 크기/타임아웃
- [x] 찜하기 API (POST/DELETE wishlist, isWishlisted 반영)

### Frontend
- [x] auctionClosed 이벤트 수신 및 UI 반영 *(완료)*
- [x] 낙관적 입찰 *(완료)*
- [x] 상태 기반 UI 정리 *(완료)*

---
## 🔒 보안 (Security)

### Backend
- [x] payOrder: `UPDATE ... WHERE status='PENDING'` 조건부 전환 (동시 결제 방지) *(완료)*
- [x] Redis publish 실패 시 로깅 (현재 `.catch(() => {})` 무시) *(완료)*
- [x] buyNow 전 잔액 사전 검증 (선택) *(완료)*

### Frontend
- *(SSE 인증은 Guest-First 설계로 의도적 미적용)*

---

## 🏠 메인페이지 SSE (실시간 갱신)

> LiveActivityFeed는 이미 useHistoryEvents로 SSE 연결됨 ✅

### Frontend
- [x] FeaturedAuction: SSE 연결 *(완료)*
- [x] MainAuctionSection: SSE 연결 *(완료)*
- [x] LiveStats: 실시간 지표 API 연동 *(완료: useLiveStats, statsUpdate SSE)*

---

## 📦 경매 등록

### Backend
- [x] POST /auctions (CreateAuctionDto) *(완료)*

### Frontend
- [x] 경매 등록 폼 UI *(완료: /me/auctions/create, AuctionForm)*
- [x] api.auctions.create 연동 *(완료)*
- [x] 이미지 업로드 (CreateAuctionDto.imageUrl) *(완료: api.uploadImage)*

---

## 👤 마이페이지 (My Page)

### Backend
- [x] 내 경매 등록 목록 API *(GET /auctions/me/selling)*
- [x] 내 참여 경매 목록 API *(입찰중: GET /auctions/me/bidding)*
- [x] 내 주문 목록 API *(GET /orders/me 활용)*

### Frontend
- [x] 마이페이지 레이아웃/라우트 *(/me, /me/auctions, /me/bids)*
- [x] 유저 정보 표시 (닉네임, 프로필, 잔액)
- [x] 내 경매 등록 목록 (수정/삭제) *(완료: useDeleteAuction, useUpdateAuction)*
- [x] 참여 경매 리스트 (입찰중·낙찰됨 탭)
- [x] 내 주문 목록 (결제 대기/완료)
- [x] 찜 목록 페이지 (/me/wishlist) *(완료)*
- [x] 경매 수정 페이지 (MyAuctionCard 수정 버튼 → /me/auctions/[id]/edit) *(완료)*

---

## ❤️ 찜하기 (Wishlist)

### Backend
- [x] GET /wishlist/me, PATCH /wishlist/:auctionId (토글) *(완료)*
- [x] 경매 목록/상세 응답에 isWishlisted 필드 반영 *(완료)*

### Frontend
- [x] 찜하기 API 연동 (AuctionCard useWishlistToggle) *(완료)*
- [x] 찜 목록 페이지 (/me/wishlist) *(완료)*
- [x] 찜 목록 API 및 useMyWishlist 훅 *(완료)*

---

## 🔧 관리자 페이지 (Admin) — *여유 있을 때*

### Backend
- [x] 관리자 전용 API (ADMIN role guard) *(완료: /admin/* @Roles(ADMIN))*
- [x] 정산 현황/집계 API *(완료: GET /admin/settlement)*
- [x] 봇 on/off 또는 관리 API *(완료: GET /admin/bots, PATCH /admin/bots/:id/enabled)*
- [x] 경매 강제 종료 API *(완료: POST /admin/auctions/:id/force-close)*
- [x] 가격 변동 차트용 입찰 히스토리 API *(완료: GET /admin/auctions/:id/bid-history)*

### Frontend
- [x] 관리자 대시보드 레이아웃/라우트 *(완료: /admin, 사이드바)*
- [x] 정산 현황 대시보드 *(완료: GET /admin/settlement)*
- [x] 봇 관리 UI *(완료: GET/PATCH /admin/bots)*
- [x] 경매 관리 (강제 종료 등) *(완료: POST /admin/auctions/:id/force-close)*
- [x] 가격 변동 차트 (Recharts) *(완료: GET /admin/auctions/:id/bid-history)*

---

## 🎨 Polish

### Frontend
- [x] 종료 임박 강조 UI *(완료: DetailProductImage urgent 타이머, Badge ending_soon)*
- [x] 최고 입찰자 표시 *(완료: BidCard TOP 뱃지, Live Bids)*

---

## 🔔 알림 (Notifications) — *여유 있을 때*

> 헤더 종 모양 아이콘으로 알림 목록/읽음 처리

### Backend
- [ ] 알림 API 설계 (GET /notifications, PATCH /notifications/:id/read)
- [ ] 알림 생성 이벤트 (낙찰, 입찰 추월, 경매 종료 임박 등)
- [ ] 실시간 알림 (SSE)

### Frontend
- [ ] 헤더에 알림(종) 아이콘 추가
- [ ] 알림 드롭다운/패널 UI
- [ ] 알림 목록 API 연동
- [ ] 읽음 처리 및 배지(미읽음 개수)

---

## 🧪 테스트 코드 (Test)

### 🟢 우선: 기본 설정
- [x] Backend: Jest 설정 및 test/ 폴더 구조 정리 *(완료: utils, services, filters, guards, interceptors)*
- [x] Frontend: Vitest + React Testing Library 도입 *(완료: 유틸/훅/캐시/Query 훅/공통 컴포넌트)*

### 🔵 여유: 커버리지 확대
- [x] Backend: 서비스 단위 테스트 *(완료: auth, auctions, orders, upload, bots, events)*
- [x] Frontend: 핵심 컴포넌트/훅 테스트 확대 *(완료)*
- [x] Backend: 남은 테스트 (선택) *(완료)*
  - [x] database.service.spec.ts
  - [x] redis.service.spec.ts
  - [x] Repository 단위 테스트 (auction, bid, order, wishlist, bot)
- [ ] E2E 테스트 (Playwright 등) — *나중에*

---

## 📚 스토리북 (Storybook) — *여유 있을 때*

### Frontend
- [ ] Storybook 설치 및 설정
- [ ] 공통 컴포넌트 스토리 (Button, Badge, Input, Dropdown 등)
- [ ] 도메인 컴포넌트 스토리 (AuctionCard, MyAuctionCard 등)
- [ ] Chromatic 또는 CI 연동 (선택)

---

## 🗄️ 인프라 / 마이그레이션

### Prisma → Supabase 마이그레이션
- [x] DB: Supabase (PostgreSQL) 전환 *(완료)*
- [x] Auth: Supabase Auth 또는 JWT 유지 *(완료)*
- [x] Supabase Storage: 이미지 업로드 전용 사용 *(완료)*
- [x] 프로덕션에서 Supabase Storage만 사용하도록 설정
- [x] `uploads` 버킷 정책 및 public URL 확인 (README 문서화)

### Redis → Upstash
- [x] Upstash Redis 계정 생성 및 연결 *(완료)*
- [x] `REDIS_URL`을 Upstash 제공 URL로 교체 (rediss://) *(완료)*
- [x] ioredis 호환 확인 (Upstash는 ioredis/redis 프로토콜 지원) *(완료)*

---

## 🟢 우선 처리 (빠르게 가능)

> 1~2일 내 단기로 가능한 작업들

### 에러/예외 처리
- [x] 404 페이지 커스터마이징 *(완료: app/not-found.tsx)*
- [x] 글로벌 에러 바운더리 (Error Boundary) *(완료: RootErrorBoundary, 홈으로 링크 추가)*
- [x] API 에러 메시지 통일 및 사용자 친화적 변환 *(완료: lib/util/apiError.ts, Fetcher 연동)*

### SEO/접근성
- [x] 페이지별 메타 태그 (title, description, og:image) *(완료: createMetadata, layout별 metadata)*
- [x] 접근성(a11y) 개선 (aria-label, 키보드 네비게이션) *(완료: Header, 필터 모달, 스킵 링크, Escape)*

### 개발 경험
- [x] 환경변수 검증 (env.validation) 스크립트 *(완료: backend npm run env:validate, frontend npm run env:validate)*
- [x] API 타입 정의 통일 (shared types 또는 OpenAPI) *(완료: shared/api-types, frontend re-export)*

---

## 🔵 여유 있을 때 (나중에)

### UX/성능
- [x] 경매 등록 후 useCreateAuction 훅 (mySelling 캐시 무효화) *(완료)*
- [x] 무한 스크롤/페이지네이션 로딩 UX 개선 (경매 목록) *(완료: 스켈레톤, isFetchingNextPage)*
- [x] 이미지 lazy loading / placeholder 최적화 *(완료: blur placeholder)*

### 관리자 페이지
- [x] 전체 상세: 🔧 관리자 페이지 (Admin) 섹션 참고

---

## 📌 남은 기능 요약 및 추천 순서

### 남은 기능 목록 (미완료 [ ] 항목)

| 순위 | 구분 | 항목 | 난이도 |
|------|------|------|--------|
| 1 | 🔔 알림 | 알림 API (GET/PATCH), 이벤트 연동, SSE | 중 |
| 2 | 🔔 알림 | 헤더 알림 아이콘, 드롭다운 UI, 읽음 처리 | 중 |
| 3 | 🧪 테스트 | E2E 테스트 (Playwright) | 중 |
| 4 | 📚 스토리북 | Storybook 설치, 공통/도메인 컴포넌트 스토리 | 하 |

### 추천 구현 순서

1. **알림 시스템** — 사용자 참여도·재방문에 직접 영향
   - Backend: `Notification` 테이블, `GET /notifications`, `PATCH /notifications/:id/read`
   - 이벤트: `auctionClosed`, `bidOutbid`, `endingSoon` → 알림 생성
   - Frontend: 헤더 종 아이콘, 드롭다운, 미읽음 배지
   - 실시간: 기존 SSE에 `notification` 이벤트 추가

2. **E2E 테스트** — 배포 전 회귀 방지
   - Playwright로 핵심 플로우: 로그인 → 입찰 → 결제 (또는 경매 등록)
   - CI에 E2E 스텝 추가

3. **스토리북** — 컴포넌트 문서화·시각적 회귀 테스트
   - Button, Badge, Input 등 공통 컴포넌트 우선
   - 도메인 컴포넌트는 여유 있을 때

### 전체 관점 추천

| 추가하면 좋은 것 | 이유 |
|------------------|------|
| **알림** | 낙찰·입찰 추월·종료 임박 등 실사용 시나리오에서 UX 향상, 이탈 감소 |
| **E2E 테스트** | 배포 전 핵심 플로우 검증, 리팩터링 시 안전망 |
| **스토리북** | 디자인 시스템 정리, 신규 개발자 온보딩 용이 |

**우선순위 권장**: 알림 > E2E > 스토리북

---

## 💡 추가 가능한 기능 아이디어

> 프로젝트 전체 관점에서 가치 있는 확장 기능 (RN 예정이라 PWA 제외)

### 🟢 추천 (포폴·실사용 모두 적합)

| 기능 | 설명 | 이유 |
|------|------|------|
| **검색** | 경매 풀텍스트 검색 (모델명, 브랜드, 설명) | 현재 필터만 있음. 상품 탐색 UX 개선 |
| **판매자 대시보드** | 내 경매별 조회수, 입찰 수, 낙찰률, 매출 | 판매자 참여도·재등록 동기 부여 |
| **리뷰·평점** | 거래 후 판매자/구매자 평점 | 신뢰도·거래 품질 향상 |
| **가격/종료 알림** | 찜한 경매 가격 하락·종료 임박 시 알림 | 찜 기능 활용도 상승 |

### 🔵 보류/제외

| 기능 | 비고 |
|------|------|
| **지갑 충전** | 포폴·실사용 애매 (결제 연동 복잡도) |
| **배송 흐름** | 지갑충전과 마찬가지로 실거래 연장선 |

### 추천 구현 순서

1. **알림** (기존 계획) — 낙찰·입찰 추월·종료 임박 인앱 알림
2. **검색** — 상품 탐색 UX 개선
3. **판매자 대시보드** — 판매자 유입·유지
4. **리뷰·평점** — 거래 신뢰도
5. **가격/종료 알림** — 찜 기능 활용도
