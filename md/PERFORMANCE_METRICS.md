# LaceUp 성능 지표 분석

> 수치로 표현 가능한 부분과 DevTools 기반 추정 방법 정리

---

## 1. DOM 노드 수 변화

### 코드 기준 상수

| 항목 | 값 | 출처 |
|------|-----|------|
| 경매 목록 페이지당 아이템 수 | 10개 | `useAuctionList` limit: 10 |
| 그리드 행당 카드 수 | 2~3개 (반응형) | `grid-cols-2 lg:grid-cols-3` |
| AuctionCard 1개당 DOM 노드 | 약 25~35개 | motion.div, Link, Image, Badge, Button, 텍스트 노드 등 |

### 가상화 적용 시 추정

| 시나리오 | 가상화 없음 | react-virtuoso 적용 | 감소율 |
|----------|-------------|---------------------|--------|
| 100개 아이템 (10페이지 스크롤) | ~2,500~3,500 노드 | ~300~400 노드 (뷰포트 9~12카드만 렌더) | **약 85~90%** |
| 50개 아이템 (5페이지) | ~1,250~1,750 노드 | ~300~400 노드 | **약 75~80%** |

### DevTools 측정 방법

```
1. Chrome DevTools → Elements → 선택 도구로 리스트 컨테이너 클릭
2. Console에서:
   document.querySelector('[data-virtuoso-scroller]')?.querySelectorAll('*').length
   // 가상화 적용 시: 뷰포트 내 노드만 카운트

3. 가상화 제거 후 동일 리스트에서:
   document.querySelector('[role="list"]')?.querySelectorAll('*').length
   // 전체 노드 수
```

---

## 2. 렌더링 시간

### 코드 기준

- **페이지 전환 애니메이션**: `duration: 0.2`, `ease: easeOut` (template.tsx)
- **AuctionCard 등장**: `duration: 0.3`, `ease: [0.23, 1, 0.32, 1]`

### 정확한 수치 없음 — DevTools 추정

| 측정 대상 | 도구 | 예상 범위 |
|-----------|------|-----------|
| 초기 경매 목록 렌더 (가상화 O) | React DevTools Profiler | 20~80ms |
| 초기 경매 목록 렌더 (가상화 X, 100개) | React DevTools Profiler | 150~400ms |
| 스크롤 시 추가 렌더 (무한 스크롤) | Profiler "Commit" | 10~30ms/페이지 |

**측정 절차**

```
1. React DevTools → Profiler 탭
2. Record 클릭 → 페이지 로드 또는 스크롤
3. Stop → "Ranked" 뷰에서 AuctionCard, VirtualizedList 컴포넌트 렌더 시간 확인
4. 또는 Performance 탭 → User Timing에서 React 메서드 구간 확인
```

---

## 3. 재연결 성공률

### 코드 기준 상수

| 항목 | 값 | 출처 |
|------|-----|------|
| 초기 재연결 지연 | 1,000ms | `INITIAL_DELAY_MS` |
| 최대 재연결 지연 | 30,000ms | `MAX_DELAY_MS` |
| 지수 백오프 | 1s → 2s → 4s → 8s → 16s → 30s(cap) | `delayRef.current * 2` |

### 정확한 수치 없음 — 추정

| 시나리오 | 예상 성공률 | 비고 |
|----------|-------------|------|
| 일시적 네트워크 끊김 (1~5초) | 95% 이상 | 1~2회 재시도 내 복구 |
| 서버 재시작 (10~30초) | 80~90% | 4~5회 재시도(총 ~31초) 내 복구 |
| 장시간 오프라인 (60초 이상) | 50~70% | 30s cap 도달 후 계속 재시도 |

### DevTools 측정 방법

```
1. Chrome DevTools → Network → Throttling "Offline" 선택
2. 3~5초 대기 후 "Online" 복구
3. Console에 로깅 추가 시:
   // useReconnectingEventSource 내 onStatusChange에서
   console.time('reconnect');
   onStatusChange?.('reconnecting');
   // onopen 시
   console.timeEnd('reconnect');
4. 또는 Network 탭에서 EventSource 요청 상태( pending → 200 ) 관찰
```

**추가 시 로깅 포인트**: `useReconnectingEventSource`의 `onStatusChange`, `onopen`에 `Date.now()` 기록 후 재연결 소요 시간 집계

---

## 4. 요청 수 감소

### 코드 기준 상수

| 항목 | 값 | 출처 |
|------|-----|------|
| staleTime | 300,000ms (5분) | `withQueryDefaults` |
| retry | 1회 | `withQueryDefaults` |
| refetchOnWindowFocus | false | `withQueryDefaults` |

### SSE vs 폴링 가정

| 방식 | 5분간 입찰 현황 갱신 | 요청 수 |
|------|----------------------|---------|
| **폴링 (3초 간격)** | 100회 | 100 |
| **폴링 (5초 간격)** | 60회 | 60 |
| **SSE (현재)** | 0회 (서버 푸시) | **0** |

### staleTime 효과 추정

| 시나리오 | staleTime 0 (기본) | staleTime 5분 | 감소 |
|----------|---------------------|---------------|------|
| 5분간 페이지 3회 이동 (메인→경매→상세) | me 3회 + auctions 3회 + 기타 | me 1회 + auctions 1회 + 기타 | **약 40~60%** |
| 탭 전환 10회 (refetchOnWindowFocus true 가정) | 10회 추가 refetch | 0회 | **100%** (현재 false라 0회) |

---

## 5. API 호출 횟수

### 코드 기준 상수

| 항목 | 값 | 출처 |
|------|-----|------|
| 경매 목록 페이지당 limit | 10 | `useAuctionList` |
| 거래 내역 limit | 50 | `useTradeHistory` |
| 백엔드 기본 limit | 20 | `auction.list.query.dto` |
| Rate Limit | 60초당 100회 | `THROTTLE_LIMIT` |

### 페이지별 초기 API 호출 (캐시 미스 시)

| 페이지 | 호출 API | 횟수 |
|--------|----------|------|
| 메인 | /auctions/main, /users/me | 2 |
| 경매 목록 | /auctions (limit 10), /users/me | 2 |
| 경매 상세 | /auctions/:id, /auctions/:id/bids, /users/me | 3 |
| 거래 내역 | /auctions/history (limit 50), /users/me | 2 |
| 마이페이지 | /users/me, /auctions/me/bidding, /orders/me 등 | 4~6 |

### 5분 세션 추정 (메인 → 목록 → 상세 1개 → 뒤로가기)

| 구분 | API 호출 수 |
|------|-------------|
| 초기 로드 (캐시 없음) | 2 + 2 + 3 = 7 |
| staleTime 5분 적용, 동일 데이터 재방문 | 0 (캐시 hit) |
| SSE 연결 | 1 (EventSource, HTTP 연결 1개) |

---

## 6. 네트워크 지연

### 코드 기준

- **SSE Heartbeat**: 15초 간격 (`HEARTBEAT_INTERVAL_MS`)
- **JWT refresh 재시도**: 401 시 1회 재시도

### 정확한 수치 없음 — DevTools 추정

| 측정 대상 | 도구 | 예상 범위 |
|-----------|------|-----------|
| API 응답 (로컬) | Network 탭 | 20~100ms |
| API 응답 (원격) | Network 탭 | 100~500ms |
| SSE 첫 연결 | Network 탭 EventSource | 50~200ms |
| 입찰 API (POST) | Network 탭 | 30~150ms |

**측정 절차**

```
1. Chrome DevTools → Network
2. "Disable cache" 체크, 페이지 로드
3. 각 요청의 "Time" 컬럼 확인 (TTFB + 응답 수신)
4. 또는 Performance 탭 → Network 섹션에서 워터폴 시각화
```

**Performance API 활용**

```js
// 브라우저 Console에서
performance.getEntriesByType('resource')
  .filter(e => e.name.includes('/api/') || e.name.includes('/events/'))
  .map(e => ({ name: e.name.split('/').pop(), duration: e.duration }))
```

---

## 7. 정리: 수치 확보를 위한 권장 작업

| 지표 | 현재 상태 | 권장 작업 |
|------|-----------|-----------|
| DOM 노드 수 | 추정만 가능 | `data-virtuoso-scroller` 등 data 속성 추가 후 Console 스크립트로 측정 |
| 렌더링 시간 | 미측정 | React Profiler 또는 `performance.mark/measure` 도입 |
| 재연결 성공률 | 미측정 | `onStatusChange`/`onopen`에 로깅 추가, A/B 테스트(가상화 유무) |
| 요청 수 | 코드 상수로 추정 가능 | Network 탭 수동 측정 또는 `fetch` 래퍼에 카운터 추가 |
| API 호출 횟수 | 코드 기준 추정 가능 | TanStack Query DevTools 또는 Network 탭 |
| 네트워크 지연 | 미측정 | Performance API 또는 Network 탭 "Time" 값 |
