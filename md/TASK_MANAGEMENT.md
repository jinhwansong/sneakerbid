# 작업 관리

> 작업순위·추가작업·보안 항목 정리 (백엔드/프론트 분리)

---

## 📌 다음에 할 작업 (TODO)

### 🔔 알림 — 우선

- [ ] 알림 API 설계 (GET /notifications, PATCH /notifications/:id/read)
- [ ] 알림 생성 이벤트 (낙찰, 입찰 추월, 경매 종료 임박)
- [ ] 실시간 알림 (SSE)
- [ ] 헤더 알림(종) 아이콘, 드롭다운/패널 UI
- [ ] 알림 목록 API 연동, 읽음 처리, 미읽음 배지

### 📚 스토리북 — 여유 있을 때

- [ ] Storybook 설치 및 설정
- [ ] 공통 컴포넌트 스토리 (Button, Badge, Input, Dropdown 등)
- [ ] 도메인 컴포넌트 스토리 (AuctionCard, MyAuctionCard 등)
- [ ] Chromatic 또는 CI 연동 *(선택)*

---

## ✅ 완료된 항목 요약

### 핵심 기능 (완료)
- 경매 등록/목록/상세, 입찰, 낙찰, 결제, 찜하기, 마이페이지
- SSE 실시간 갱신 (메인, LiveStats, 거래내역)
- 관리자 페이지 (정산, 봇, 경매 강제종료, 차트)
- OAuth (Google/Kakao), JWT, Redis 리프레시

### 테스트·인프라 (완료)
- Backend: Jest 단위/E2E, Frontend: Vitest 단위, Playwright E2E
- Supabase (DB, Storage), Upstash Redis
- 404, Error Boundary, env 검증, Swagger

---

## 📂 완료 내역 (상세)

### Critical
- [x] SSE Redis Pub/Sub
- [x] payOrder 조건부 상태 전환 (이중 결제 방지)
- [x] PENDING 주문 타임아웃 Cron
- [x] 결제 실패 시 Auction REOPEN
- [x] SSE 재연결(backoff)
- [x] 입찰 실패 UX 개선

### Important
- [x] 경매 종료 전용 이벤트 (auctionClosed)
- [x] 봇 시뮬레이션 개선
- [x] EventsService 구독 0일 때 Subject 정리
- [x] closeExpiredAuctions 배치
- [x] 찜하기 API
- [x] auctionClosed 이벤트 수신·UI 반영
- [x] 낙관적 입찰, 상태 기반 UI

### 보안
- [x] payOrder 조건부 전환, Redis publish 로깅, buyNow 잔액 사전 검증

### 경매·마이페이지
- [x] 경매 등록/목록/상세, 이미지 업로드
- [x] 마이페이지 (/me, auctions, bids, wishlist), 주문 목록
- [x] 경매 수정 (/me/auctions/[id]/edit)

### 관리자
- [x] ADMIN guard, 정산 API, 봇 관리, 강제 종료, 입찰 히스토리 차트

### Polish
- [x] 종료 임박 강조, 최고 입찰자 표시, 404, Error Boundary
- [x] 메타 태그, 접근성, env 검증, API 타입 통일

### 테스트
- [x] Backend Jest + E2E, Frontend Vitest + Playwright E2E

### 인프라
- [x] Supabase (DB, Storage), Upstash Redis

---

## 💡 추가 가능한 기능 아이디어

### 추천 (체크리스트)

- [ ] **검색** — 경매 풀텍스트 검색 (상품 탐색 UX 개선)
- [ ] **판매자 대시보드** — 조회수, 입찰 수, 낙찰률, 매출
- [ ] **리뷰·평점** — 거래 후 판매자/구매자 평점
- [ ] **가격/종료 알림** — 찜한 경매 가격 하락·종료 임박 시 알림

### 보류

- 지갑 충전 *(결제 연동 복잡도)*
- 배송 흐름 *(실거래 연장선)*

**추천 순서**: 알림 → 검색 → 판매자 대시보드 → 리뷰·평점 → 가격/종료 알림
