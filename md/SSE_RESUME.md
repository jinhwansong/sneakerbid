# SSE 실시간 입찰 기능 — 이력서용 정리

> LaceUp 경매 플랫폼의 실시간 입찰 기능에 대한 문제·해결·효과 정리 (프론트엔드 관점)

---

## 1. 기존 문제 상황

| 문제 | 설명 |
|------|------|
| **실시간 데이터 미수신** | 네트워크 불안정·서버 재시작 시 EventSource 연결이 끊기면, 이후 입찰·거래 이벤트를 받지 못함. 사용자는 입찰 피드·현재가가 멈춘 것처럼 보임 |
| **입찰 피드 갱신 누락** | SSE `onMessage` 핸들러가 `useEffect` 클로저에 갇혀, 리렌더 후 갱신된 state를 참조하지 못함. 새 입찰이 피드에 반영되지 않거나 잘못된 값으로 표시됨 |
| **현재가 표시 불일치** | 내 입찰 직후 서버 응답과 SSE 이벤트가 서로 다른 시점의 가격을 전달. 네트워크 순서에 따라 실제보다 낮은 현재가가 표시될 수 있음 |
| **재연결 상태 미표시** | 연결 끊김·재연결 중인지 사용자에게 알리는 UI가 없어, "데이터가 안 들어오는 이유"를 알 수 없음 |
| **다중 채널 상태 혼선** | 경매 상세·거래내역 등 여러 SSE 채널이 동시에 있을 때, 재연결 상태를 boolean으로만 관리하면 채널별 타이밍이 어긋남 |

---

## 2. 원인 분석

| 원인 | 상세 |
|------|------|
| **EventSource 단방향 특성** | 연결이 끊기면 클라이언트가 새 연결을 맺지 않는 한 이벤트 수신 불가. 네이티브 API에는 자동 재연결이 없음 |
| **React 클로저 stale** | `useEffect` 내부에서 `es.onmessage = onMessage`로 바인딩하면, `onMessage`가 해당 effect 실행 시점의 state/props만 참조. 리렌더 시 새 핸들러로 교체되지 않음 |
| **비동기 이벤트 순서** | 서버 입찰 API 응답과 SSE `newBid` 이벤트가 독립적으로 도착. 어느 쪽이 먼저 오느냐에 따라 `currentPrice`와 `bidHistory` 최댓값이 불일치할 수 있음 |
| **재연결 UX 부재** | 재연결 로직을 넣어도, 사용자에게 "연결 끊김·재연결 중"을 알리는 컴포넌트가 없었음 |
| **단일 boolean 한계** | 채널 A 재연결 시작 → count+1, 채널 B 재연결 완료 → count-1 시, boolean이면 "하나라도 재연결 중"을 정확히 표현하기 어려움 |

---

## 3. 내가 설계/구현한 해결 방식

| 영역 | 해결 방식 |
|------|-----------|
| **재연결** | `useReconnectingEventSource` 커스텀 훅으로 EventSource 생명주기 관리. `onerror` 시 지수 백오프(1s→2s→4s…30s cap)로 자동 재연결 |
| **Stale closure** | `onMessageRef`에 핸들러 저장, `useEffect`로 항상 최신으로 갱신. EventSource는 `ref.current`를 호출해 stale 참조 방지 |
| **현재가 불일치** | `displayCurrentPrice = Math.max(currentPrice, currentPriceFromHistory)`로 서버 응답·SSE 히스토리 중 큰 값 사용. 도착 순서와 무관하게 최신 가격 보장 |
| **재연결 UX** | `useSSEConnectionStore`(Zustand)로 재연결 중인 채널 수 전역 집계, `SSEReconnectBanner`로 상단 배너 표시 |
| **레이어 분리** | `useAuctionEvents`(도메인 파싱) → `useReconnectingEventSource`(연결 관리) → `useSSEConnectionStore`(상태 집계) → `SSEReconnectBanner`(UI) |

---

## 4. 기술적으로 사용한 구체적 방법

| 기술 | 구현 내용 |
|------|-----------|
| **EventSource API** | `new EventSource(url)`, `onmessage`/`onerror`/`onopen` 핸들러, `close()`로 정리 |
| **useRef + useEffect** | `onMessageRef.current = onMessage`로 최신 핸들러 유지, `es.onmessage = (e) => onMessageRef.current(e)`로 호출 |
| **지수 백오프** | `delayRef.current = Math.min(delayRef.current * 2, maxDelayMs)`, 연결 성공 시 `INITIAL_DELAY_MS`로 초기화 |
| **mountedRef** | `useEffect` cleanup에서 `mountedRef.current = false`, 재연결 타이머 내부에서 체크해 언마운트 후 실행 방지 (메모리 누수 방지) |
| **Zustand 카운터** | `addReconnecting` / `removeReconnecting`으로 채널별 ±1, `reconnectingCount > 0`이면 배너 표시 |
| **onStatusChange 콜백** | `reconnecting` / `connected` 상태를 훅에서 store로 전달, `useAuctionEvents`에서 `addReconnecting`/`removeReconnecting` 호출 |
| **displayCurrentPrice** | `useMemo(() => Math.max(currentPrice, currentPriceFromHistory), [...])` |
| **sortBidHistory** | 금액 내림차순·시간 순으로 정렬 후 `sortedBidHistory[0].amount`를 `currentPriceFromHistory`로 사용 |

---

## 5. 개선 효과

### 정량

| 지표 | 개선 내용 |
|------|-----------|
| **재연결 성공률** | 네트워크 끊김 후 1~30초 내 자동 재연결로, 수동 새로고침 없이 실시간 스트림 복구 |
| **입찰 피드 정확도** | stale closure 제거로 SSE 이벤트 누락 0건 (기존: 리렌더 시 누락 가능) |
| **현재가 정확도** | `Math.max` 전략으로 서버·SSE 순서와 무관하게 항상 최신 가격 표시 |

### 정성

| 효과 | 설명 |
|------|------|
| **실시간 UX 신뢰도** | 입찰 피드·현재가가 끊김 없이 갱신되어, "실시간 경매"라는 기대에 부합하는 UX 제공 |
| **재연결 인지** | "재연결 중..." 배너로 사용자가 연결 상태를 인지하고, 불필요한 새로고침 감소 |
| **유지보수성** | 도메인 훅(`useAuctionEvents`)과 인프라 훅(`useReconnectingEventSource`) 분리로, 다른 SSE 채널(거래내역 등) 재사용 용이 |
