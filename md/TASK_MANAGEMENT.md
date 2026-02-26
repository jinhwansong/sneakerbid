# 작업 관리

> 작업순위·추가작업·보안 항목 정리 (백엔드/프론트 분리)

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
- [ ] 경매 종료 전용 이벤트 (auctionClosed)
- [ ] 봇 시뮬레이션 개선 (per-auction cooldown 등)
- [ ] EventsService 구독 0일 때 Subject 정리
- [ ] closeExpiredAuctions 배치 크기/타임아웃
- [ ] 찜하기 API (POST/DELETE wishlist, isWishlisted 반영)

### Frontend
- [ ] 낙관적 입찰
- [ ] 상태 기반 UI 정리

---

## 🔒 보안 (Security)

### Backend
- [x] payOrder: `UPDATE ... WHERE status='PENDING'` 조건부 전환 (동시 결제 방지) *(완료)*
- [x] Redis publish 실패 시 로깅 (현재 `.catch(() => {})` 무시) *(완료)*
- [x] buyNow 전 잔액 사전 검증 (선택) *(완료)*

### Frontend
- *(SSE 인증은 Guest-First 설계로 의도적 미적용)*

---

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
