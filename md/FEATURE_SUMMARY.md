# LaceUp 기능별 문제·해결 정리

---

## [SSE]

**문제:**
- 네트워크 끊김·서버 재시작 시 EventSource 연결이 끊기면 입찰·거래 이벤트를 받지 못함
- `onMessage` 핸들러가 React 클로저에 갇혀 리렌더 후 최신 state를 참조하지 못해 입찰 피드 갱신 누락
- 서버 응답과 SSE 이벤트 도착 순서에 따라 현재가가 실제보다 낮게 표시됨
- 재연결 중인지 사용자에게 알리는 UI가 없음

**원인:**
- EventSource는 단방향 연결이라 끊기면 자동 재연결 없음
- `useEffect` 내부 `es.onmessage = onMessage` 바인딩 시 해당 시점의 클로저만 참조
- 서버 입찰 API 응답과 SSE `newBid`가 독립적으로 도착해 순서 불일치 발생
- 재연결 상태를 전역에서 집계·표시하는 레이어 부재

**해결:**
- `useReconnectingEventSource` 훅으로 `onerror` 시 지수 백오프(1s→30s) 자동 재연결
- `onMessageRef`에 핸들러 저장, `ref.current` 호출로 stale closure 방지
- `displayCurrentPrice = Math.max(currentPrice, currentPriceFromHistory)`로 항상 최신 가격 표시
- `useSSEConnectionStore`(Zustand)로 재연결 채널 수 집계, `SSEReconnectBanner`로 상단 배너 표시

**기술:**
- EventSource API, useRef, useEffect, mountedRef(언마운트 후 타이머 정리)
- Zustand `addReconnecting`/`removeReconnecting` 카운터
- `useAuctionEvents` → `useReconnectingEventSource` → `useSSEConnectionStore` 레이어 분리

**효과:**
- 네트워크 끊김 후 1~30초 내 자동 재연결, 수동 새로고침 불필요
- 입찰 피드 갱신 누락 제거
- 서버·SSE 순서와 무관하게 최신 현재가 표시
- "재연결 중..." 배너로 연결 상태 인지 가능

---

## [무한스크롤]

**문제:**
- 경매 목록을 한 번에 전부 로드하면 초기 로딩이 길고, 스크롤 시 추가 데이터를 불러오는 흐름이 없음

**원인:**
- 페이지네이션 없이 전체 조회 시 데이터·렌더 비용 증가
- 사용자가 끝까지 스크롤해도 다음 페이지를 요청하는 로직 부재

**해결:**
- `useInfiniteQuery`로 커서 기반 페이지네이션, 스크롤 끝 도달 시 `fetchNextPage` 호출
- `getNextPageParam`으로 `nextCursor` 전달, `afterId`로 다음 페이지 요청
- 필터(brand, size, sort) 변경 시 queryKey 변경으로 첫 페이지부터 재조회

**기술:**
- TanStack Query `useInfiniteQuery`, `initialPageParam`, `getNextPageParam`
- `queryKeys.auctions.list({ brand, size, sort })`로 필터별 캐시 분리
- `queryDefaults`(staleTime 5분) 적용으로 동일 필터 재방문 시 캐시 활용

**효과:**
- 초기 로드 10개만 요청, 스크롤 시 10개씩 추가 로드
- 필터 변경 시 자동으로 새 목록 조회
- 5분 내 재방문 시 API 호출 감소

---

## [가상화 리스트]

**문제:**
- 경매 목록·거래내역 등 수십~수백 개 아이템을 전부 렌더하면 DOM 노드가 과도하게 늘어나 스크롤·렌더 성능 저하

**원인:**
- 모든 아이템을 DOM에 올리면 100개 기준 2,500개 이상 노드, 초기 렌더·리플로우 비용 증가

**해결:**
- `react-virtuoso` 기반 `VirtualizedList`로 뷰포트에 보이는 아이템만 렌더
- `useWindowScroll` + `endReached`로 스크롤 끝 도달 시 `loadMore` 호출(무한스크롤 연동)
- `itemContent`로 제네릭 `renderItem` 패턴, 로딩/에러/빈 상태 공통 처리

**기술:**
- react-virtuoso `Virtuoso`, `useWindowScroll`, `endReached`
- `itemGap`, `Footer` 컴포넌트(로딩 스피너, "스크롤하여 더 보기" 등)
- 경매 목록·거래내역·랭킹 페이지에서 공통 사용

**효과:**
- 100개 아이템 기준 DOM 노드 약 85~90% 감소(2,500+ → 300~400)
- 스크롤 시 추가 렌더만 발생해 초기 로드·스크롤 성능 개선

---

## [JWT 자동 갱신]

**문제:**
- access 토큰 만료(401) 시 refresh 호출 후 원래 요청 재시도하는데, refresh도 401이면 무한 루프 발생

**원인:**
- refresh 실패 시에도 재시도 로직이 다시 돌아가며, 종료 조건이 없어 401 → refresh → 401 → … 반복

**해결:**
- `_skipRefreshRetry` 내부 플래그로 refresh 후 재시도 요청에는 두 번째 재시도 차단
- refresh가 401이면 재시도 없이 바로 throw

**기술:**
- `Fetcher` 내부 `doFetch`, `_skipRefreshRetry` 옵션
- `if (res.status === 401 && !_skipRefreshRetry)` 조건으로 refresh 1회만 시도
- 재시도 시 `_skipRefreshRetry: true` 전달

**효과:**
- 401 무한 루프 제거, 탭 멈춤·요청 폭주 방지
- 토큰 만료 시 로그인 페이지 유도 가능

---

## [현재가 표시]

**문제:**
- 내 입찰 직후 서버 응답 `currentPrice`와 SSE `newBid` 이벤트가 서로 다른 시점의 가격을 전달해, 화면에 실제보다 낮은 현재가가 표시될 수 있음

**원인:**
- 서버 응답과 SSE 이벤트가 비동기로 독립 도착. SSE가 먼저 오면 `currentPrice`는 아직 이전 값, 반대 경우 SSE의 더 높은 입찰이 반영되지 않음

**해결:**
- `displayCurrentPrice = Math.max(currentPrice, currentPriceFromHistory)`로 두 소스 중 큰 값 사용
- `currentPriceFromHistory`는 `sortBidHistory` 후 `sortedBidHistory[0].amount`

**기술:**
- `useMemo`로 `displayCurrentPrice`, `currentPriceFromHistory` 계산
- `sortBidHistory`(금액 내림차순, 시간 순)로 히스토리 정렬

**효과:**
- 도착 순서와 무관하게 항상 최신 가격 표시
- 잘못된 입찰 기준으로 인한 오류 방지

---

## [결제 모달]

**문제:**
- 즉시구매 시 "주문 생성" API 성공 후 "결제" 단계로 넘어가기 전에 모달을 닫을 수 있어, PENDING 주문만 남고 결제는 진행되지 않음

**원인:**
- `creating`, `paying` 단계에서도 오버레이·닫기 버튼이 활성화되어 있어 사용자가 중간에 종료 가능

**해결:**
- Step 상태(`confirm` | `creating` | `paying` | `complete` | `error`)로 단계별 UI 제어
- `creating`, `paying`일 때 `onClick={undefined}`로 오버레이 클릭·닫기 비활성화

**기술:**
- `useState<Step>`, `onConfirm` 콜백에서 `setStep` 전달
- `onClick={step === 'confirm' || step === 'complete' || step === 'error' ? handleClose : undefined}`
- Framer Motion `AnimatePresence`로 단계별 애니메이션

**효과:**
- 미결제 PENDING 주문 누적 방지
- 결제 플로우 완료 전 중간 종료 차단
