# 작업 관리

> 작업순위·추가작업·보안 항목 정리 (백엔드/프론트 분리)

---

## 📋 미구현 항목 요약 (체크리스트)

| 구분 | 항목 | Backend | Frontend |
|------|------|---------|----------|
| 경매 등록 | UI 및 API 연동 | ✅ API 있음 | ❌ 폼 UI 없음 |
| 경매 등록 목록 | API | ✅ 완료 | ✅ 완료 |
| 찜하기 | API + UI | ❌ API 없음 | ❌ API 연동 없음 |
| 찜 목록 페이지 | /me/wishlist | - | ❌ 페이지 없음 |
| 메인 FeaturedAuction | SSE 실시간 갱신 | ✅ | ✅ 완료 |
| 메인 MainAuctionSection | SSE 실시간 갱신 | ✅ | ✅ 완료 |
| LiveStats | 실시간 지표 | ❌ API 없음 | ❌ 하드코딩 |
| 이벤트 페이지 | 별도 페이지 | - | ❌ 없음 |
| 관리자 페이지 | 전체 | ❌ | ❌ |
| 경매 수정 | MyAuctionCard | ✅ API 있음 | ❌ placeholder |

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
- [ ] 찜하기 API (POST/DELETE wishlist, isWishlisted 반영)

### Frontend
<<<<<<< HEAD
- [x] auctionClosed 이벤트 수신 및 UI 반영 *(완료)*
- [x] 낙관적 입찰 *(완료)*
- [x] 상태 기반 UI 정리 *(완료)*
=======
- [ ] auctionClosed 이벤트 수신 및 UI 반영 *(아래 상세)*
- [ ] 낙관적 입찰
- [ ] 상태 기반 UI 정리

---

#### auctionClosed 이벤트 — 프론트 작업 상세

백엔드에서 경매 종료 시 SSE로 `auctionClosed` 이벤트를 전송합니다. 프론트는 이를 수신해 즉시 UI를 갱신해야 합니다.

| 작업 | 위치 | 내용 |
|------|------|------|
| 이벤트 파싱 | `useAuctionEvents` | `parsed?.type === 'auctionClosed'` 분기 추가, `onAuctionClosed` 콜백 호출 |
| 상태 반영 | `AuctionDetailClient` | `onAuctionClosed`에서 `item.status = 'closed'`, `isExpired = true` 등으로 UI 전환 |
| 낙찰자/즉구 표시 | 상세 페이지 | `payload.status === 'buy_now'` → 즉시구매 완료, `winnerUserId` → 낙찰자 표시 |
| 입찰 비활성화 | `DetailBidControl` | auctionClosed 수신 시 즉시 PLACE BID / BUY NOW 버튼 비활성화 |
| 카운트다운 정지 | `useCountdown` | `isExpired` 강제 설정 또는 `endTime` 과거로 갱신 |

**페이로드 타입** (참고):
```ts
interface AuctionClosedPayload {
  status: 'CLOSED' | 'buy_now';
  winnerUserId: string | null;
  finalPrice: number;
}
```
>>>>>>> 3caa4282465c197455a87cae5390dc1cef6cc961

---

## 🔒 보안 (Security)

### Backend
- [x] payOrder: `UPDATE ... WHERE status='PENDING'` 조건부 전환 (동시 결제 방지) *(완료)*
- [x] Redis publish 실패 시 로깅 (현재 `.catch(() => {})` 무시) *(완료)*
- [x] buyNow 전 잔액 사전 검증 (선택) *(완료)*

### Frontend
- *(SSE 인증은 Guest-First 설계로 의도적 미적용)*

---

<<<<<<< HEAD
## 🏠 메인페이지 SSE (실시간 갱신)

> LiveActivityFeed는 이미 useHistoryEvents로 SSE 연결됨 ✅

### Frontend
- [x] FeaturedAuction: SSE 연결 *(완료)*
- [x] MainAuctionSection: SSE 연결 *(완료: useMainPageSSE)*
- [ ] LiveStats: 실시간 지표 API 연동 (현재 하드코딩: 1,284, 42, 8.4억 등)

---

## 📦 경매 등록

### Backend
- [x] POST /auctions (CreateAuctionDto) *(완료)*

### Frontend
- [ ] 경매 등록 폼 UI (/me/auctions/new)
- [ ] api.auctions.create 연동
- [ ] 이미지 업로드 또는 URL 입력 (CreateAuctionDto.imageUrl)

---

## 👤 마이페이지 (My Page)

### Backend
- [x] 내 경매 등록 목록 API *(GET /auctions/me/selling)*
- [x] 내 참여 경매 목록 API *(입찰중: GET /auctions/me/bidding)*
- [x] 내 주문 목록 API *(GET /orders/me 활용)*

### Frontend
- [x] 마이페이지 레이아웃/라우트 *(/me, /me/auctions, /me/bids)*
- [x] 유저 정보 표시 (닉네임, 프로필, 잔액)
- [x] 내 경매 등록 목록 (수정/삭제) *(삭제 완료, 수정 placeholder)*
- [x] 참여 경매 리스트 (입찰중·낙찰됨 탭)
- [x] 내 주문 목록 (결제 대기/완료)
- [ ] 찜 목록 페이지 (/me/wishlist) - **페이지 없음**
- [ ] 경매 수정 페이지 (MyAuctionCard 수정 버튼 → edit 페이지)

---

## ❤️ 찜하기 (Wishlist)

### Backend
- [ ] POST /wishlist (찜 추가)
- [ ] DELETE /wishlist/:auctionId (찜 해제)
- [ ] 경매 목록/상세 응답에 isWishlisted 필드 반영

### Frontend
- [ ] 찜하기 API 연동 (FeaturedAuction, AuctionCard handleWatch)
- [ ] 찜 목록 페이지 (/me/wishlist) 생성
- [ ] 찜 목록 API 및 useWishlist 훅

---

## 🎪 이벤트 페이지

### Frontend
- [ ] 이벤트/프로모션 페이지 (별도 라우트) - **현재 없음**
=======
## 👤 마이페이지 (My Page)

### Backend
- [ ] 내 경매 등록 목록 API (GET /me/auctions)
- [ ] 내 참여 경매 목록 API (입찰한 경매)
- [ ] 내 주문 목록 API *(기존 GET /orders/me 활용)*

### Frontend
- [ ] 마이페이지 레이아웃/라우트
- [ ] 유저 정보 표시 (닉네임, 프로필, 잔액)
- [ ] 내 경매 등록 목록 (수정/삭제)
- [ ] 참여 경매 리스트 (입찰한 경매)
- [ ] 내 주문 목록 (결제 대기/완료)
>>>>>>> 3caa4282465c197455a87cae5390dc1cef6cc961

---

## 🔧 관리자 페이지 (Admin)

### Backend
- [ ] 관리자 전용 API (ADMIN role guard)
- [ ] 정산 현황/집계 API
- [ ] 봇 on/off 또는 관리 API
- [ ] 경매 강제 종료 API
- [ ] 가격 변동 차트용 입찰 히스토리 API (Recharts)

### Frontend
- [ ] 관리자 대시보드 레이아웃/라우트
- [ ] 정산 현황 대시보드
- [ ] 봇 관리 UI
- [ ] 경매 관리 (강제 종료 등)
- [ ] 가격 변동 차트 (Recharts)

---

## 🎨 Polish

### Frontend
- [x] 종료 임박 강조 UI *(완료: DetailProductImage urgent 타이머, Badge ending_soon)*
- [x] 최고 입찰자 표시 *(완료: BidCard TOP 뱃지, Live Bids)*
