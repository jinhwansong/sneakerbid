# LaceUp — 실시간 스니커즈 경매 플랫폼

> 실시간 데이터 흐름, SSE 기반 연결 관리, 경합 상황 UX를 중심으로 설계한 풀스택 경매 플랫폼 포트폴리오입니다.

**Demo**: 비회원도 입찰·실시간 피드를 즉시 체험할 수 있습니다 (시뮬레이션 봇 활성화)

---

## 목차

1. [프로젝트 소개](#1-프로젝트-소개)
2. [핵심 UX 설계](#2-핵심-ux-설계)
3. [상태 관리 전략](#3-상태-관리-전략)
4. [실시간 처리 구조](#4-실시간-처리-구조-sse)
5. [주요 트러블슈팅](#5-주요-트러블슈팅)
6. [기술 스택](#6-기술-스택)
7. [실행 방법](#7-실행-방법)

---

## 1. 프로젝트 소개

LaceUp는 실시간 입찰 경쟁이 발생하는 스니커즈 경매 플랫폼입니다.  
"입찰이 실시간으로 반영되지 않으면 사용자는 잘못된 가격을 기준으로 행동한다"는 문제의식에서 출발했습니다.

**주요 기능**

- 실시간 입찰 피드 (SSE 기반, 자동 재연결)
- 입찰 / 즉시 구매 / 낙찰 결제 플로우
- 봇 시뮬레이션으로 비회원도 즉시 실시간 UX 체험 가능
- 무한 스크롤 경매 목록, 브랜드·사이즈·정렬 필터
- 실시간 거래 내역 피드 (별도 SSE 채널)
- 라이트/다크 모드 완전 지원

**백엔드 요약** (NestJS + PostgreSQL + Redis)  
입찰 시 `SELECT FOR UPDATE`로 행 락을 잡아 동시 입찰 경합을 방지하고, Soft-close(마감 10초 전 입찰 시 5분 자동 연장, 최대 3회)로 경매 조기 종료를 막습니다. Redis Pub/Sub으로 다중 인스턴스 간 SSE 이벤트를 동기화합니다.  
프론트엔드에서는 이 구조에 맞춰 **서버 응답을 실시간으로 수신하고 UI를 선제적으로 반영**하는 방식으로 소비합니다.

---

## 2. 핵심 UX 설계

### 2-1. 입찰 상태 관리 — "서버 응답을 믿되, 표시는 낙관적으로"

입찰은 경합이 발생할 수 있는 액션입니다. 낙관적 업데이트(optimistic update)를 적용하면 서버가 거부했을 때 롤백이 복잡해지므로, **입찰 요청은 서버 응답을 기다린 뒤 UI를 반영**합니다.

대신 SSE를 통해 다른 사용자의 입찰이 실시간으로 들어오면 즉시 현재가를 갱신합니다. 이 조합으로 "내 입찰은 확실하게 / 남의 입찰은 즉시 반영"이라는 UX를 달성합니다.

```
입찰 버튼 클릭
  → API 요청 (서버 락 → 검증 → 저장)
  → 성공 응답 수신 후 currentPrice, bidAmount 갱신
  → 병렬로 SSE 이벤트 수신 시 bidHistory 선제 업데이트
```

**현재가 표시 전략**: SSE로 받은 히스토리 최댓값과 서버 응답 currentPrice 중 큰 값을 `displayCurrentPrice`로 표시합니다. 어느 쪽이 먼저 오더라도 항상 최신 가격을 보장합니다.

```ts
// AuctionDetailClient.tsx
const displayCurrentPrice = useMemo(
  () => Math.max(currentPrice, currentPriceFromHistory),
  [currentPrice, currentPriceFromHistory],
);
```

### 2-2. Soft-close 카운트다운 — 경매 긴장감 표현

백엔드가 Soft-close를 적용하면 `endTime`이 연장됩니다. 프론트는 SSE로 업데이트된 입찰 데이터를 수신하면 `useCountdown`이 새 endTime으로 자동 재계산합니다. 마감 임박 시 타이머 색상과 뱃지를 `urgent` 상태로 전환해 경매 긴장감을 UX로 표현합니다.

### 2-3. 결제 플로우 모달 — 단계별 피드백

즉시 구매는 "주문 생성 → 결제" 두 단계를 거칩니다. 비동기 처리 중 사용자가 결과를 알 수 없는 구간을 없애기 위해 `Step` 타입 상태 머신으로 모달 UI를 전환합니다.

```ts
type Step = 'confirm' | 'creating' | 'paying' | 'complete' | 'error';
```

진행 중(`creating`, `paying`)에는 닫기 버튼을 비활성화해 중간 취소로 인한 불완전 상태를 방지합니다.

### 2-4. 페이지 전환 애니메이션 — `app/template.tsx`

Next.js App Router의 `template.tsx`를 활용해 페이지 전환마다 `AnimatePresence`와 Framer Motion으로 Fade+Slide 애니메이션을 적용합니다. `layout.tsx`가 아닌 `template.tsx`를 사용해 레이아웃(헤더·푸터) 유지와 페이지 애니메이션을 분리했습니다.

### 2-5. 무한 스크롤 + 가상화 — 대규모 목록 성능 보장

경매 목록은 React Query `useInfiniteQuery` + cursor 기반 페이지네이션, `react-virtuoso`로 DOM 노드 수를 제한합니다. 필터(브랜드/사이즈/정렬) 변경 시 queryKey가 바뀌어 자동으로 첫 페이지부터 재조회됩니다.

---

## 3. 상태 관리 전략

서버 상태와 클라이언트 상태를 명확히 분리했습니다.

| 영역 | 도구 | 이유 |
|------|------|------|
| 서버 상태 (경매 목록, 내 정보 등) | TanStack Query | 캐싱·중복 요청 제거·staleTime 통일 관리 |
| 실시간 입찰 피드 | 로컬 `useState` | 페이지 단위 상태, 다른 컴포넌트와 공유 불필요 |
| SSE 재연결 상태 | Zustand | 여러 SSE 채널을 전역에서 집계, 배너 표시 |
| 토스트 메시지 | Zustand | 레이아웃 최상단에서 단일 렌더링 |
| 로그인 상태 | TanStack Query (`useMe`) | 전역 캐시로 중복 요청 방지, 로그아웃 시 `setQueryData`로 즉시 반영 |

### QueryClient 전역 에러 처리

`QueryCache.onError`에서 401/403을 감지해 "로그인이 필요합니다." 토스트를 중앙 처리합니다. `useMe`는 에러 시 `null`을 반환하도록 별도 처리해 전역 에러 토스트에서 제외합니다.

```ts
// QueryProvider.tsx
if (key0 === queryKeys.me[0]) return; // me 쿼리는 전역 에러 토스트 제외
```

### 인증 상태 즉시 반영

로그아웃 시 API 호출 성공 여부와 무관하게 `queryClient.setQueryData(queryKeys.me, null)`로 캐시를 즉시 무효화합니다. 네트워크 오류 시에도 UI 상태가 "로그인됨"으로 남지 않습니다.

### staleTime 전략

모든 쿼리에 `staleTime: 5분`을 기본 적용합니다. 실시간 데이터(입찰 현황)는 SSE로 수신하므로 폴링 없이도 최신 상태를 유지합니다. 이 설계로 불필요한 API 요청을 최소화합니다.

---

## 4. 실시간 처리 구조 (SSE)

### 레이어 구조

```
useAuctionEvents / useHistoryEvents   ← 도메인별 이벤트 파싱
        ↓
useReconnectingEventSource            ← EventSource 생명주기 + 지수 백오프 재연결
        ↓
useSSEConnectionStore (Zustand)       ← 재연결 중인 채널 수 전역 집계
        ↓
SSEReconnectBanner                    ← 재연결 중일 때 상단 배너 표시
```

### 재연결 전략 (`useReconnectingEventSource`)

`EventSource.onerror` 발생 시 지수 백오프(1s → 2s → 4s … 최대 30s)로 재연결을 시도합니다. 연결 성공 시 딜레이를 1s로 초기화합니다. 컴포넌트 언마운트 시 `mountedRef`로 재연결 타이머를 안전하게 정리해 메모리 누수를 방지합니다.

```ts
// 지수 백오프
delayRef.current = Math.min(delayRef.current * 2, maxDelayMs);
```

### 재연결 상태 집계 (count 기반)

복수의 SSE 채널(경매 상세, 거래 내역)이 동시에 연결될 수 있습니다. boolean 플래그 대신 **카운터**를 사용해 "어느 하나라도 재연결 중이면 배너 표시"를 정확하게 구현합니다.

```ts
// useSSEConnectionStore.ts
reconnectingCount: 0,
addReconnecting: () => set((s) => ({ reconnectingCount: s.reconnectingCount + 1 })),
removeReconnecting: () => set((s) => ({ reconnectingCount: Math.max(0, s.reconnectingCount - 1 })),
```

### 다중 인스턴스 SSE 동기화 (백엔드)

백엔드는 Redis Pub/Sub으로 모든 서버 인스턴스에 SSE 이벤트를 브로드캐스트합니다. 프론트엔드는 이를 투명하게 소비하며, 어느 인스턴스에 연결되어도 동일한 실시간 피드를 받습니다.

---

## 5. 주요 트러블슈팅

### T1. SSE 재연결 중 오래된 핸들러 참조 문제

**문제**: `useEffect` 내부 `onMessage` 클로저가 stale해져 최신 상태를 참조하지 못함.

**해결**: `onMessageRef`에 핸들러를 저장하고 `useEffect`로 항상 최신으로 갱신합니다. EventSource의 핸들러는 `ref.current`를 호출해 클로저 문제를 우회합니다.

```ts
const onMessageRef = useRef(onMessage);
useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

es.onmessage = (e) => onMessageRef.current(e); // 항상 최신 핸들러 호출
```

### T2. 401 토큰 만료 시 무한 루프

**문제**: 401 응답 → refresh 시도 → refresh도 401 → 다시 원래 요청 → 무한 반복.

**해결**: `_skipRefreshRetry` 플래그를 내부 전용 옵션으로 관리합니다. refresh 후 재시도 요청에는 이 플래그를 `true`로 설정해 두 번째 재시도를 막습니다.

```ts
// fetcher.ts
if (res.status === 401 && !_skipRefreshRetry) {
  // refresh 시도
  const retry = await doFetch(input, { ...options, _skipRefreshRetry: true });
}
```

### T3. 현재가 표시 불일치 (SSE vs 서버 응답 순서)

**문제**: 내 입찰 직후 다른 사용자의 SSE 입찰이 수신되면, 서버 응답의 `currentPrice`보다 SSE 값이 더 클 수 있음.

**해결**: 두 값 중 큰 값을 `displayCurrentPrice`로 사용합니다. 어떤 이벤트가 먼저 도착하든 항상 최신 가격이 표시됩니다.

```ts
const displayCurrentPrice = useMemo(
  () => Math.max(currentPrice, currentPriceFromHistory),
  [currentPrice, currentPriceFromHistory],
);
```

### T4. `isCancelledError` deprecated (React Query v5)

**문제**: TanStack Query v5에서 `isCancelledError(error)` 함수가 deprecated.

**해결**: `error instanceof CancelledError`로 교체합니다. 동작은 동일하지만 타입 정보가 명확해집니다.

### T5. 결제 모달 중간 종료 방지

**문제**: 주문 생성 후 결제 전 모달을 닫으면 주문이 미결제 상태로 남음.

**해결**: Step 상태 머신으로 `creating`, `paying` 단계에서 닫기 버튼과 오버레이 클릭을 비활성화합니다.

```ts
onClick={
  step === 'confirm' || step === 'complete' || step === 'error'
    ? handleClose
    : undefined  // 처리 중에는 닫기 차단
}
```

---

## 6. 기술 스택

### Frontend

| 분류 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (Custom Design Token) |
| 서버 상태 | TanStack Query v5 |
| 클라이언트 상태 | Zustand |
| 애니메이션 | Framer Motion |
| 가상화 | react-virtuoso |
| 아이콘 | Lucide React |
| 차트 | Recharts |

### Backend (요약)

| 분류 | 기술 |
|------|------|
| Framework | NestJS |
| ORM | Prisma |
| DB | PostgreSQL |
| Cache / Pub-Sub | Redis (ioredis) |
| 인증 | OAuth 2.0 (Google / Kakao) + JWT |
| 실시간 | SSE (Server-Sent Events) |

### DX

- ESLint + Prettier + Husky (pre-commit)
- TypeScript strict mode
- `tsc --noEmit` type check

---

## 7. 실행 방법

```bash
# 의존성 설치
pnpm install   # 또는 npm install

# 환경 변수 설정
cp .env.example .env.local   # frontend
cp .env.example .env         # backend

# DB 마이그레이션 및 시드
cd backend
npx prisma migrate dev
npx prisma db seed

# 개발 서버 실행
# 터미널 1 (백엔드)
cd backend && npm run start:dev

# 터미널 2 (프론트엔드)
cd frontend && npm run dev
```

필수 환경 변수: `DATABASE_URL`, `REDIS_URL`, `GOOGLE_CLIENT_ID`, `KAKAO_CLIENT_ID`, `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`
