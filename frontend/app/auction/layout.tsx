import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '경매 탐색',
  description: '실시간으로 진행 중인 모든 스니커즈 경매를 확인하고 입찰에 참여하세요.',
  path: '/auction',
});

export default function AuctionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
