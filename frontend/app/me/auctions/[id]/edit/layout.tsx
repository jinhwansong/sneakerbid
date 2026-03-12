import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '경매 수정',
  description: '등록한 경매 정보를 수정합니다.',
  path: '/me/auctions',
});

export default function AuctionEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
