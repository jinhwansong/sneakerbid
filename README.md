# 👟 SNEAKERBID (실시간 스니커즈 경매 플랫폼)

> **"실시간 경매 시스템의 프론트엔드 설계 및 UX 역량을 증명하는 포트폴리오 프로젝트"**

SNEAKERBID는 Toss의 직관적인 금융 UX와 KREAM의 트렌디한 커머스 디자인을 결합한 실시간 스니커즈 경매 플랫폼입니다. 실제 서비스 운영이 가능한 수준의 확장성 있는 폴더 구조와 엄격한 코드 품질 관리 환경을 갖추고 있습니다.

---

## ✨ 핵심 가치 (Core Values)

### 1. Guest-First UX (체험 중심 설계)
*   **Zero-Barrier 진입**: 첫 방문 시 로그인/회원가입 절차 없이 즉시 경매 시스템을 체험할 수 있도록 설계되었습니다.
*   **실시간 시뮬레이션 엔진**: 실제 유저가 없는 환경에서도 실시간성을 느낄 수 있도록 **AI Simulation Agent**가 입찰에 참여하며 동적인 데이터 흐름을 만들어냅니다.
*   **온보딩 전략**: 세션당 1회 노출되는 전략적 모달을 통해 서비스의 기획 의도와 기술적 로드맵을 사용자에게 효과적으로 전달합니다.

### 2. Premium Editorial Design
*   **Toss Style**: Pretendard 폰트 기반의 대담한 타이포그래피, 넉넉한 여백, 정보 위계에 따른 숫자 강조(`tabular-nums`).
*   **KREAM Style**: 이미지 중심의 카드 레이아웃, 프리미엄 상품을 돋보이게 하는 다크 모드 최적화 배경색 설계.
*   **Micro Interactions**: Framer Motion을 활용한 부드러운 스케일 애니메이션, 플로팅 토스트 메시지, 실시간 티커(Ticker) 효과.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4 (Custom Design System)
- **Animation**: Framer Motion
- **State Management**: Zustand (Custom Toast System)
- **Icons**: Lucide React
- **Notifications**: Custom Toast System

### DX & Quality Control
- **Git Hooks**: Husky & lint-staged (Pre-commit Lint/Type Check)
- **Commit Convention**: Commitlint & aicommits (Conventional Commits)
- **Formatting**: Prettier & ESLint
- **Performance CI**: Lighthouse CI Config

---

## 📁 Project Structure

```text
frontend/
├── app/                  # 페이지 및 글로벌 스타일 (Dark/Light Mode)
├── components/
│   ├── common/           # Button, Badge, Toast 등 공통 UI
│   ├── layout/           # Header, Footer 등 구조적 컴포넌트
│   ├── auction/          # Featured, Grid, Feed 등 경매 도메인 특화 UI
│   └── features/         # OnboardingModal 등 주요 기능 단위
├── lib/                  # 유틸리티(cn, format) 및 더미 데이터
├── store/                # Zustand Toast Store
└── types/                # Auction 관련 TypeScript 정의
```

---

## 🚀 Future Roadmap

단순한 리스트 페이지를 넘어, 실제 프로덕트로 성장하기 위한 기술적 로드맵을 설계했습니다.

- [ ] **Auth Integration**: 소셜 로그인(NextAuth) 연동 및 회원 전용 입찰 관리
- [ ] **Real-time Engine**: WebSocket(Socket.io) 또는 Server-Sent Events(SSE) 연동
- [ ] **Notification System**: 낙찰/관심 경매 푸시 알림 및 멀티 디바이스 동기화
- [ ] **Data Visualization**: 실시간 가격 변동 추이 차트(Recharts) 고도화
