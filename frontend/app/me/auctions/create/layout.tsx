import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '경매 등록',
  description: '새로운 스니커즈 경매를 등록하세요.',
  path: '/me/auctions/create',
});

export default function AuctionCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
